/**
 * UploadService — Sincronización de Subida (Push/Upload)
 * Usa expo-file-system en lugar de react-native-fs.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { database } from '../database';
import Respondent from '../database/models/Respondent';
import Answer from '../database/models/Answer';
import Survey from '../database/models/Survey';
import { apiClient } from '../api/client';
import { Q } from '@nozbe/watermelondb';
import { useAuthStore } from '../features/auth/store';
import notifee, { AndroidImportance, AndroidForegroundServiceType } from '@notifee/react-native';

export interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  current: number;
}

export interface UploadResult {
  total: number;
  uploaded: number;
  failed: number;
}

// Expo FileSystem en este Android requiere file:// para encontrar archivos
function withFilePrefix(path: string): string {
  return path.startsWith('file://') ? path : 'file://' + path;
}

export async function uploadPendingRespondents(
  onProgress?: (p: UploadProgress) => void
): Promise<UploadResult> {
  const respondentsCollection = database.get<Respondent>('respondents');
  const surveysCollection = database.get<Survey>('surveys');

  const pending = await respondentsCollection
    .query(Q.where('status', 1))
    .fetch();

  const total = pending.length;
  let uploaded = 0;
  let failed = 0;

  if (total === 0) return { total: 0, uploaded: 0, failed: 0 };

  const surveys = await surveysCollection.query(Q.where('status', 1)).fetch();
  const localSurvey = surveys[0];
  if (!localSurvey) return { total: 0, uploaded: 0, failed: 0 };

  const allAnswers = await Promise.all(
    pending.map((respondent) =>
      database
        .get<Answer>('answers')
        .query(Q.where('respondent_id', respondent.id))
        .fetch()
    )
  );

  // Crear canal y helper de notificación de Foreground Service (DATA_SYNC)
  const UPLOAD_NOTIFICATION_ID = 'upload_progress_notification';
  let uploadChannelId: string | null = null;
  try {
    uploadChannelId = await notifee.createChannel({
      id: 'upload_service',
      name: 'Sincronización de Encuestas',
      description: 'Notificación de subida de encuestas en segundo plano',
      importance: AndroidImportance.LOW,
    });
  } catch (e) {
    console.warn('[UploadService] No se pudo crear canal de notificación de subida:', e);
  }

  const updateUploadNotification = async (completed: number, max: number) => {
    if (!uploadChannelId) return;
    try {
      await notifee.displayNotification({
        id: UPLOAD_NOTIFICATION_ID,
        title: '☁️ Subiendo encuestas...',
        body: `Subiendo ${completed} de ${max} registro(s)...`,
        android: {
          channelId: uploadChannelId,
          asForegroundService: true,
          foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_DATA_SYNC],
          ongoing: true,
          progress: {
            max,
            current: completed,
          },
          smallIcon: 'ic_launcher',
        },
      });
    } catch (e) {
      console.warn('[UploadService] Error actualizando notificación de subida:', e);
    }
  };

  try {
    await updateUploadNotification(0, total);

    // Sequential on purpose: progress callback must report accurate current index,
    // and concurrent uploads could overwhelm slow mobile connections.
    for (let i = 0; i < pending.length; i++) {
      const respondent = pending[i];

      onProgress?.({ total, completed: uploaded + failed, failed, current: i + 1 });
      await updateUploadNotification(uploaded + failed, total);

      try {
        const answers = allAnswers[i];

        const answersPayload = answers.map((a) => ({
          questionId: a.serverQuestionId,
          optionId: a.serverOptionId ?? null,
          subOptionId: a.serverSubOptionId ?? null,
          openText: a.openText ?? null,
        }));

        const formData = new FormData();
        formData.append('surveyId', String(localSurvey.serverSurveyId));
        let surveyorId = respondent.surveyorId;
        if (surveyorId === 'local' || !surveyorId) {
          surveyorId = String(useAuthStore.getState().user?.id ?? '');
        }
        formData.append('surveyorId', surveyorId);
        if (respondent.age !== null) formData.append('age', String(respondent.age));
        if (respondent.gender) formData.append('gender', respondent.gender);
        if (respondent.schooling) formData.append('schooling', respondent.schooling);
        if (respondent.latitude !== null) formData.append('latitude', String(respondent.latitude));
        if (respondent.longitude !== null) formData.append('longitude', String(respondent.longitude));
        formData.append('isCancelled', String(respondent.isCancelled));
        formData.append('answers', JSON.stringify(answersPayload));

        // Adjuntar imagen como base64
        if (respondent.imagePath) {
          const fileUri = withFilePrefix(respondent.imagePath);
          const info = await FileSystem.getInfoAsync(fileUri);
          console.log(`[UploadService] imagePath="${fileUri}" exists=${info.exists}`);
          if (info.exists) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            formData.append('imageData', base64);
            console.log('[UploadService] imagen adjuntada como base64');
          } else {
            console.warn('[UploadService] archivo de imagen NO EXISTE en la ruta guardada');
          }
        } else {
          console.log('[UploadService] imagePath es null, no hay imagen para adjuntar');
        }

        // Adjuntar audio como base64
        if (respondent.audioPath) {
          const fileUri = withFilePrefix(respondent.audioPath);
          const info = await FileSystem.getInfoAsync(fileUri);
          console.log(`[UploadService] audioPath="${fileUri}" exists=${info.exists}`);
          if (info.exists) {
            const base64 = await FileSystem.readAsStringAsync(fileUri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            formData.append('audioData', base64);
            console.log('[UploadService] audio adjuntado como base64');
          } else {
            console.warn('[UploadService] archivo de audio NO EXISTE en la ruta guardada');
          }
        } else {
          console.log('[UploadService] audioPath es null, no hay audio para adjuntar');
        }

        const response = await apiClient.post('/responses/submit', formData, {
          timeout: 60000,
        });

        console.log(`[UploadService] Respuesta del servidor para respondent ${respondent.id}:`, response.data);

        // Marcar como sincronizado
        await database.write(async () => {
          await respondent.update((r) => { r.status = 2; });
        });

        // Limpiar archivos locales (REQ-CLEAN-02)
        await deleteFileIfExists(respondent.imagePath);
        await deleteFileIfExists(respondent.audioPath);

        uploaded++;
      } catch (err: any) {
        console.error(`[UploadService] Error subiendo respondent ${respondent.id}:`, err.message);
        failed++;
      }
    }

    onProgress?.({ total, completed: uploaded + failed, failed, current: total });
    await updateUploadNotification(uploaded + failed, total);
    return { total, uploaded, failed };
  } finally {
    await notifee.stopForegroundService().catch(() => {});
    await notifee.cancelNotification(UPLOAD_NOTIFICATION_ID).catch(() => {});
  }
}

export async function getPendingCount(): Promise<number> {
  return database
    .get<Respondent>('respondents')
    .query(Q.where('status', 1))
    .fetchCount();
}

export async function getLocalProgress(surveyLocalId: string): Promise<{
  men: number; women: number; total: number;
}> {
  const respondentsCollection = database.get<Respondent>('respondents');
  const [men, women] = await Promise.all([
    respondentsCollection
      .query(
        Q.where('survey_id', surveyLocalId),
        Q.where('gender', Q.oneOf(['Hombre', 'M'])),
        Q.where('status', Q.gte(1))
      )
      .fetchCount(),
    respondentsCollection
      .query(
        Q.where('survey_id', surveyLocalId),
        Q.where('gender', Q.oneOf(['Mujer', 'F'])),
        Q.where('status', Q.gte(1))
      )
      .fetchCount(),
  ]);
  return { men, women, total: men + women };
}

async function deleteFileIfExists(filePath: string | null) {
  if (!filePath) return;
  try {
    const fileUri = withFilePrefix(filePath);
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch (e) {
    console.warn('[UploadService] No se pudo borrar archivo:', filePath, e);
  }
}
