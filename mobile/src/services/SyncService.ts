/**
 * SyncService — Sincronización de Bajada (Download/Pull)
 *
 * Responsabilidades:
 *  1. Consultar GET /api/assignments/me con el JWT del encuestador.
 *  2. Comparar si ya existe una campaña local en WatermelonDB.
 *     - Si es la misma (mismo serverSurveyId): retornar "ya al día".
 *     - Si es diferente: retornar indicador para que el UI pida confirmación.
 *     - Si no hay ninguna: descargar y persistir.
 *  3. Escribir Survey + Questions + Options + SubOptions en una
 *     transacción WatermelonDB (todo o nada).
 */

import { database } from '../database';
import Survey from '../database/models/Survey';
import Question from '../database/models/Question';
import Option from '../database/models/Option';
import SubOption from '../database/models/SubOption';
import { apiClient } from '../api/client';
import { Q } from '@nozbe/watermelondb';

export type SyncStatus =
  | { type: 'up_to_date' }
  | { type: 'conflict'; localSurveyTitle: string; newSurveyTitle: string }
  | { type: 'downloaded'; survey: Survey }
  | { type: 'no_assignment' }
  | { type: 'error'; message: string };

/** Obtiene la encuesta activa local (si existe). */
export async function getLocalSurvey(): Promise<Survey | null> {
  const surveys = await database
    .get<Survey>('surveys')
    .query(Q.where('status', 1))
    .fetch();
  return surveys[0] ?? null;
}

/**
 * Ejecuta la sincronización de bajada.
 * Devuelve un SyncStatus para que el UI decida cómo proceder.
 */
export async function syncAssignment(): Promise<SyncStatus> {
  try {
    const response = await apiClient.get('/assignments/me');
    const data = response.data;

    // El endpoint devuelve la asignación completa con la encuesta anidada
    const serverSurveyId: number = data.survey.id;
    const assignmentId: number = data.id;
    const menCount: number = data.menCount ?? 0;
    const womenCount: number = data.womenCount ?? 0;
    const survey = data.survey;

    // Verificar campaña local existente
    const localSurvey = await getLocalSurvey();

    if (localSurvey) {
      if (localSurvey.serverSurveyId === serverSurveyId) {
        // Misma encuesta — nada que hacer
        return { type: 'up_to_date' };
      } else {
        // Encuesta diferente — pedir confirmación al usuario
        return {
          type: 'conflict',
          localSurveyTitle: localSurvey.title,
          newSurveyTitle: survey.title,
        };
      }
    }

    // No hay campaña local — descargar y persistir
    await performDownload(survey, assignmentId, serverSurveyId, menCount, womenCount);
    const newLocal = await getLocalSurvey();
    return { type: 'downloaded', survey: newLocal! };

  } catch (err: any) {
    if (err?.response?.status === 404) {
      return { type: 'no_assignment' };
    }
    console.error('[SyncService] Error:', err);
    return { type: 'error', message: err.message ?? 'Error de red' };
  }
}

/**
 * Fuerza la descarga de una encuesta, reemplazando cualquier campaña local.
 * Llamar SOLO después de que el usuario confirme el cambio.
 */
export async function forceDownload(): Promise<SyncStatus> {
  try {
    const response = await apiClient.get('/assignments/me');
    const data = response.data;

    const serverSurveyId: number = data.survey.id;
    const assignmentId: number = data.id;
    const menCount: number = data.menCount ?? 0;
    const womenCount: number = data.womenCount ?? 0;

    // Borrar campaña local anterior (cascade borrará preguntas, opciones)
    await clearLocalSurvey();
    await performDownload(data.survey, assignmentId, serverSurveyId, menCount, womenCount);

    const newLocal = await getLocalSurvey();
    return { type: 'downloaded', survey: newLocal! };
  } catch (err: any) {
    return { type: 'error', message: err.message ?? 'Error al forzar descarga' };
  }
}

/** Elimina toda la campaña local y sus registros (preguntas, opciones, respondentes). */
export async function clearLocalSurvey() {
  await database.write(async () => {
    const surveys = await database.get<Survey>('surveys').query().fetch();
    const questions = await database.get<Question>('questions').query().fetch();
    const options = await database.get<Option>('options').query().fetch();
    const subOptions = await database.get<SubOption>('sub_options').query().fetch();

    // WatermelonDB: marcar para borrar en batch
    const toDestroy = [
      ...surveys.map(r => r.prepareDestroyPermanently()),
      ...questions.map(r => r.prepareDestroyPermanently()),
      ...options.map(r => r.prepareDestroyPermanently()),
      ...subOptions.map(r => r.prepareDestroyPermanently()),
    ];

    await database.batch(...toDestroy);
  });
}

/** Escribe la encuesta descargada en WatermelonDB en una sola transacción. */
async function performDownload(
  survey: any,
  assignmentId: number,
  serverSurveyId: number,
  menCount: number,
  womenCount: number
) {
  await database.write(async () => {
    const surveysCollection = database.get<Survey>('surveys');
    const questionsCollection = database.get<Question>('questions');
    const optionsCollection = database.get<Option>('options');
    const subOptionsCollection = database.get<SubOption>('sub_options');

    const localSurvey = await surveysCollection.create((s) => {
      s.serverSurveyId = serverSurveyId;
      s.assignmentId = assignmentId;
      s.title = survey.title;
      s.description = survey.description ?? '';
      s.location = survey.location ?? null;
      s.status = 1;
      s.menCount = menCount;
      s.womenCount = womenCount;
      s.syncedAt = new Date().toISOString();
    });

    for (const q of survey.questions ?? []) {
      const localQuestion = await questionsCollection.create((lq) => {
        // @ts-ignore WatermelonDB internal setter
        lq._raw.survey_id = localSurvey.id;
        lq.serverId = q.id;
        lq.text = q.text;
        lq.typeId = q.typeId;
      });

      for (const opt of q.options ?? []) {
        await optionsCollection.create((lo) => {
          // @ts-ignore
          lo._raw.question_id = localQuestion.id;
          lo.serverId = opt.id;
          lo.text = opt.text;
          lo.image = opt.image ?? null;
        });
      }

      for (const sub of q.subOptions ?? []) {
        await subOptionsCollection.create((ls) => {
          // @ts-ignore
          ls._raw.question_id = localQuestion.id;
          ls.serverId = sub.id;
          ls.text = sub.text;
        });
      }
    }
  });
}
