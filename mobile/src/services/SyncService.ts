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
import Respondent from '../database/models/Respondent';
import Answer from '../database/models/Answer';
import { apiClient, API_BASE_URL } from '../api/client';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system/legacy';

const SERVER_ORIGIN = API_BASE_URL.replace('/api', '');

async function downloadOptionImage(imageUrl: string, optionId: number): Promise<string> {
  try {
    const filename = imageUrl.split('/').pop() || `${optionId}.jpg`;
    const localDir = FileSystem.documentDirectory + 'options/';
    await FileSystem.makeDirectoryAsync(localDir, { intermediates: true }).catch(() => {});
    const localPath = localDir + filename;

    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;

    const fullUrl = imageUrl.startsWith('http') ? imageUrl : SERVER_ORIGIN + imageUrl;
    const result = await FileSystem.downloadAsync(fullUrl, localPath);
    return result.uri;
  } catch (error) {
    console.warn(`[SyncService] Error descargando imagen ${imageUrl}, usando URL remota:`, error);
    return imageUrl.startsWith('http') ? imageUrl : SERVER_ORIGIN + imageUrl;
  }
}

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
    const serverCompletedMen: number = data.completedProgress?.men ?? 0;
    const serverCompletedWomen: number = data.completedProgress?.women ?? 0;
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
    await performDownload(survey, assignmentId, serverSurveyId, menCount, womenCount, serverCompletedMen, serverCompletedWomen);
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
    const serverCompletedMen: number = data.completedProgress?.men ?? 0;
    const serverCompletedWomen: number = data.completedProgress?.women ?? 0;

    // Borrar campaña local anterior (cascade borrará preguntas, opciones)
    await clearLocalSurvey();
    await performDownload(data.survey, assignmentId, serverSurveyId, menCount, womenCount, serverCompletedMen, serverCompletedWomen);

    const newLocal = await getLocalSurvey();
    return { type: 'downloaded', survey: newLocal! };
  } catch (err: any) {
    return { type: 'error', message: err.message ?? 'Error al forzar descarga' };
  }
}

/** Elimina toda la campaña local y sus registros (preguntas, opciones, respondentes). */
export async function clearLocalSurvey() {
  await database.write(async () => {
    const [surveys, questions, options, subOptions] = await Promise.all([
      database.get<Survey>('surveys').query().fetch(),
      database.get<Question>('questions').query().fetch(),
      database.get<Option>('options').query().fetch(),
      database.get<SubOption>('sub_options').query().fetch(),
    ]);

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

/** Elimina TODA la base de datos local + archivos multimedia. */
export async function clearAllLocalData() {
  // 1. Recopilar rutas de archivos antes de borrar registros
  const respondents = await database.get<Respondent>('respondents').query().fetch();
  const mediaPaths: string[] = [];
  for (const r of respondents) {
    if (r.imagePath) mediaPaths.push(r.imagePath);
    if (r.audioPath) mediaPaths.push(r.audioPath);
  }

  // 2. Borrar archivos multimedia individuales
  await Promise.all(mediaPaths.map(async (path) => {
    try {
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) await FileSystem.deleteAsync(path, { idempotent: true });
    } catch (e) {
      console.warn('[SyncService] No se pudo borrar archivo:', path, e);
    }
  }));

  // 3. Borrar directorios completos de opciones y audios
  const dirs = ['options/', 'audios/'].map(d => FileSystem.documentDirectory + d);
  await Promise.all(dirs.map(async (dir) => {
    try {
      const info = await FileSystem.getInfoAsync(dir);
      if (info.exists) await FileSystem.deleteAsync(dir, { idempotent: true });
    } catch (e) {
      console.warn('[SyncService] No se pudo borrar directorio:', dir, e);
    }
  }));

  // 4. Borrar TODOS los registros de todas las tablas (orden inverso de dependencias)
  await database.write(async () => {
    const tables = ['answers', 'respondents', 'sub_options', 'options', 'questions', 'surveys'] as const;
    const allRecords = await Promise.all(
      tables.map(t => database.get<any>(t).query().fetch())
    );
    const toDestroy = allRecords.flatMap(records =>
      records.map(r => r.prepareDestroyPermanently())
    );
    await database.batch(...toDestroy);
  });
}

/** Escribe la encuesta descargada en WatermelonDB en una sola transacción. */
async function performDownload(
  survey: any,
  assignmentId: number,
  serverSurveyId: number,
  menCount: number,
  womenCount: number,
  serverCompletedMen?: number,
  serverCompletedWomen?: number
) {
  // Pre-descargar imágenes de opciones antes del batch de DB
  const optionImageMap: Record<string, string> = {};
  const allImageDownloads: Promise<{ id: number; path: string }>[] = [];
  for (const q of survey.questions ?? []) {
    for (const opt of q.options ?? []) {
      if (opt.image && typeof opt.image === 'string' && !opt.image.startsWith('data:')) {
        allImageDownloads.push(
          downloadOptionImage(opt.image, opt.id).then((path) => ({ id: opt.id, path }))
        );
      }
    }
  }
  const imageResults = await Promise.all(allImageDownloads);
  for (const { id, path } of imageResults) {
    optionImageMap[`${id}`] = path;
  }

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
      s.serverCompletedMen = serverCompletedMen ?? 0;
      s.serverCompletedWomen = serverCompletedWomen ?? 0;
      s.syncedAt = new Date().toISOString();
    });

    const questions = survey.questions ?? [];
    const createdQuestions = await Promise.all(
      questions.map((q) =>
        questionsCollection.create((lq) => {
          // @ts-ignore WatermelonDB internal setter
          lq._raw.survey_id = localSurvey.id;
          lq.serverId = q.id;
          lq.text = q.text;
          lq.typeId = q.typeId;
        })
      )
    );

    const childOps: Promise<any>[] = [];
    questions.forEach((q, idx) => {
      const localQuestion = createdQuestions[idx];
      for (const opt of q.options ?? []) {
        childOps.push(
          optionsCollection.create((lo) => {
            // @ts-ignore
            lo._raw.question_id = localQuestion.id;
            lo.serverId = opt.id;
            lo.text = opt.text;
            lo.image = optionImageMap[`${opt.id}`] ?? (opt.image?.startsWith('data:') ? null : opt.image ?? null);
          })
        );
      }
      for (const sub of q.subOptions ?? []) {
        childOps.push(
          subOptionsCollection.create((ls) => {
            // @ts-ignore
            ls._raw.question_id = localQuestion.id;
            ls.serverId = sub.id;
            ls.text = sub.text;
          })
        );
      }
    });

    await Promise.all(childOps);
  });
}
