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

  const surveys = await surveysCollection.query(Q.where('status', 1)).fetch();
  const localSurvey = surveys[0];
  if (!localSurvey) return { total: 0, uploaded: 0, failed: 0 };

  for (let i = 0; i < pending.length; i++) {
    const respondent = pending[i];

    onProgress?.({ total, completed: uploaded + failed, failed, current: i + 1 });

    try {
      const answers = await database
        .get<Answer>('answers')
        .query(Q.where('respondent_id', respondent.id))
        .fetch();

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

      // Adjuntar imagen si existe
      if (respondent.imagePath) {
        const info = await FileSystem.getInfoAsync(respondent.imagePath);
        if (info.exists) {
          formData.append('image', {
            uri: respondent.imagePath,
            type: 'image/jpeg',
            name: 'photo.jpg',
          } as any);
        }
      }

      // Adjuntar audio si existe
      if (respondent.audioPath) {
        const info = await FileSystem.getInfoAsync(respondent.audioPath);
        if (info.exists) {
          formData.append('audio', {
            uri: respondent.audioPath,
            type: 'audio/m4a',
            name: 'audio.m4a',
          } as any);
        }
      }

      await apiClient.post('/responses/submit', formData, {
        timeout: 60000,
      });

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
  return { total, uploaded, failed };
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
    const info = await FileSystem.getInfoAsync(filePath);
    if (info.exists) await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch (e) {
    console.warn('[UploadService] No se pudo borrar archivo:', filePath, e);
  }
}
