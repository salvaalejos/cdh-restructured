/**
 * Survey Store (Zustand)
 *
 * Gestiona el estado de la encuesta activa. Ahora conectado a WatermelonDB:
 *  - Las preguntas se leen desde la BD local (no mocks).
 *  - Cada respuesta se persiste inmediatamente en la tabla `answers` (REQ-EXEC-02).
 *  - Al finalizar, el Respondent se actualiza con status=1, imagePath, audioPath.
 */

import { create } from 'zustand';
import AudioRecorderService from '../../services/AudioRecorderService';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Survey from '../../database/models/Survey';
import Question from '../../database/models/Question';
import Option from '../../database/models/Option';
import SubOption from '../../database/models/SubOption';
import Respondent from '../../database/models/Respondent';
import Answer from '../../database/models/Answer';
import { useAuthStore } from '../auth/store';
import * as Location from 'expo-location';

// ─── Tipos de la UI ───────────────────────────────────────────────────────────

export interface UIOption {
  id: string;       // WatermelonDB local ID
  serverId: number; // Backend real ID
  text: string;
  image?: string | null;
}

export interface UISubOption {
  id: string;
  serverId: number;
  text: string;
}

export interface UIQuestion {
  id: string;       // WatermelonDB local ID
  serverId: number; // Backend real ID
  text: string;
  typeId: number;   // 1=abierta, 2=única, 3=múltiple, 4=matriz_única, 5=matriz_múltiple
  options?: UIOption[];
  subOptions?: UISubOption[];
}

// ─── State ────────────────────────────────────────────────────────────────────

interface SurveyState {
  // Modos de UI
  isActive: boolean;       // Cuestionario en pantalla
  isTestMode: boolean;     // No guarda en BD
  isCancelled: boolean;
  isLoading: boolean;      // Spinner mientras inicia
  showForm: boolean;       // Mostrar RespondentFormScreen

  // Progreso
  currentIndex: number;
  questions: UIQuestion[];
  answers: Record<string, any>; // { [questionLocalId]: respuesta }

  // Referencias DB
  activeRespondentId: string | null;
  activeSurveyLocalId: string | null;

  // Acciones
  openForm: (options?: { isTest?: boolean }) => Promise<void>;
  closeForm: () => void;
  startRealSurvey: (demographics: { gender: string; age: number; schooling: string }) => Promise<void>;
  startTestSurvey: (demographics: { gender: string; age: number; schooling: string }) => Promise<void>;
  setAnswer: (questionId: string, answer: any) => Promise<void>;
  nextQuestion: () => void;
  prevQuestion: () => void;
  cancelSurvey: () => Promise<void>;
  endSurvey: (photoUri: string | null, audioUri: string | null) => Promise<void>;
}

// ─── Helper: cargar preguntas de la BD local ──────────────────────────────────

async function loadQuestionsFromDB(surveyLocalId: string): Promise<UIQuestion[]> {
  const rawQuestions = await database
    .get<Question>('questions')
    .query(Q.where('survey_id', surveyLocalId), Q.sortBy('server_id', Q.asc))
    .fetch();

  const uiQuestions = await Promise.all(rawQuestions.map(async (q) => {
    const [rawOptions, rawSubs] = await Promise.all([
      database.get<Option>('options').query(Q.where('question_id', q.id), Q.sortBy('server_id', Q.asc)).fetch(),
      database.get<SubOption>('sub_options').query(Q.where('question_id', q.id), Q.sortBy('server_id', Q.asc)).fetch(),
    ]);
    return {
      id: q.id,
      serverId: q.serverId,
      text: q.text,
      typeId: q.typeId,
      options: rawOptions.map((o) => ({
        id: o.id,
        serverId: o.serverId,
        text: o.text,
        image: o.image,
      })),
      subOptions: rawSubs.map((s) => ({
        id: s.id,
        serverId: s.serverId,
        text: s.text,
      })),
    };
  }));

  return uiQuestions;
}

// ─── Helper: persistir una respuesta en WatermelonDB ─────────────────────────

/**
 * Para preguntas de tipo 2 (única): answer es un string (serverId del option)
 * Para tipo 3 (múltiple): answer es string[] (serverIds de las opciones)
 * Para tipos 4/5 (matriz): answer es Record<subOptionLocalId, serverId | serverId[]>
 * Para tipo 1 (abierta): answer es string de texto
 *
 * Guardamos siempre usando server_question_id, server_option_id, server_sub_option_id
 * para que el payload de subida ya tenga los IDs reales.
 */
async function persistAnswer(
  respondentId: string,
  question: UIQuestion,
  answer: any
) {
  const answersCollection = database.get<Answer>('answers');

  // Borrar respuestas previas de esta pregunta para este respondente (re-respuesta)
  const existing = await answersCollection
    .query(
      Q.where('respondent_id', respondentId),
      Q.where('question_id', question.id)
    )
    .fetch();

  await database.write(async () => {
    // Eliminar previas
    const destroyOps = existing.map((a) => a.prepareDestroyPermanently());

    // Construir nuevas filas
    const createOps: any[] = [];

    const optionMap = new Map(question.options?.map(o => [o.id, o]) ?? []);
    const subOptionMap = new Map(question.subOptions?.map(s => [s.id, s]) ?? []);

    if (question.typeId === 1) {
      // Abierta
      createOps.push(
        answersCollection.prepareCreate((a: Answer) => {
          // @ts-ignore
          a._raw.respondent_id = respondentId;
          // @ts-ignore
          a._raw.question_id = question.id;
          a.serverQuestionId = question.serverId;
          a.serverOptionId = null;
          a.serverSubOptionId = null;
          a.openText = String(answer ?? '');
        })
      );
    } else if (question.typeId === 2) {
      // Única: answer es el local option id
      const opt = optionMap.get(answer);
      if (opt) {
        createOps.push(
          answersCollection.prepareCreate((a: Answer) => {
            // @ts-ignore
            a._raw.respondent_id = respondentId;
            // @ts-ignore
            a._raw.question_id = question.id;
            a.serverQuestionId = question.serverId;
            a.serverOptionId = opt.serverId;
            a.serverSubOptionId = null;
            a.openText = null;
          })
        );
      }
    } else if (question.typeId === 3) {
      // Múltiple: answer es string[] de local option ids
      const selectedIds: string[] = Array.isArray(answer) ? answer : [];
      for (const optLocalId of selectedIds) {
        const opt = optionMap.get(optLocalId);
        if (opt) {
          createOps.push(
            answersCollection.prepareCreate((a: Answer) => {
              // @ts-ignore
              a._raw.respondent_id = respondentId;
              // @ts-ignore
              a._raw.question_id = question.id;
              a.serverQuestionId = question.serverId;
              a.serverOptionId = opt.serverId;
              a.serverSubOptionId = null;
              a.openText = null;
            })
          );
        }
      }
    } else if (question.typeId === 4) {
      // Matriz única: answer es Record<optLocalId, subLocalId>
      const matrixAns: Record<string, string> = answer ?? {};
      for (const [optLocalId, subLocalId] of Object.entries(matrixAns)) {
        const opt = optionMap.get(optLocalId);
        const sub = subOptionMap.get(subLocalId);
        if (opt && sub) {
          createOps.push(
            answersCollection.prepareCreate((a: Answer) => {
              // @ts-ignore
              a._raw.respondent_id = respondentId;
              // @ts-ignore
              a._raw.question_id = question.id;
              a.serverQuestionId = question.serverId;
              a.serverOptionId = opt.serverId;
              a.serverSubOptionId = sub.serverId;
              a.openText = null;
            })
          );
        }
      }
    } else if (question.typeId === 5) {
      // Matriz múltiple: answer es Record<optLocalId, subLocalId[]>
      const matrixAns: Record<string, string[]> = answer ?? {};
      for (const [optLocalId, subLocalIds] of Object.entries(matrixAns)) {
        const opt = optionMap.get(optLocalId);
        for (const subLocalId of subLocalIds ?? []) {
          const sub = subOptionMap.get(subLocalId);
          if (opt && sub) {
            createOps.push(
              answersCollection.prepareCreate((a: Answer) => {
                // @ts-ignore
                a._raw.respondent_id = respondentId;
                // @ts-ignore
                a._raw.question_id = question.id;
                a.serverQuestionId = question.serverId;
                a.serverOptionId = opt.serverId;
                a.serverSubOptionId = sub.serverId;
                a.openText = null;
              })
            );
          }
        }
      }
    }

    await database.batch(...destroyOps, ...createOps);
  });
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSurveyStore = create<SurveyState>((set, get) => ({
  isActive: false,
  isTestMode: false,
  isCancelled: false,
  isLoading: false,
  showForm: false,
  currentIndex: 0,
  questions: [],
  answers: {},
  activeRespondentId: null,
  activeSurveyLocalId: null,

  openForm: async (options) => {
    const sessionId = `${Date.now()}`;
    await AudioRecorderService.startRecording(sessionId).catch((e) =>
      console.error('[SurveyStore] Error al iniciar audio en openForm:', e)
    );
    set({ showForm: true, isTestMode: options?.isTest ?? false });
  },
  closeForm: async () => {
    await AudioRecorderService.stopRecording().catch(console.error);
    set({ showForm: false });
  },

  // ── Iniciar encuesta REAL ─────────────────────────────────────────────────
  startRealSurvey: async ({ gender, age, schooling }) => {
    set({ isLoading: true, showForm: false });

    try {
      const surveys = await database
        .get<Survey>('surveys')
        .query(Q.where('status', 1))
        .fetch();
      const localSurvey = surveys[0];

      if (!localSurvey) {
        console.error('[SurveyStore] No hay encuesta local activa.');
        set({ isLoading: false, showForm: false });
        return;
      }

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch (e) {
        console.warn('[SurveyStore] No se pudo obtener GPS:', e);
      }

      let respondent: Respondent;
      await database.write(async () => {
        respondent = await database.get<Respondent>('respondents').create((r) => {
          // @ts-ignore
          r._raw.survey_id = localSurvey.id;
          r.surveyorId = String(useAuthStore.getState().user?.id ?? '');
          r.age = age;
          r.gender = gender;
          r.schooling = schooling;
          r.latitude = lat;
          r.longitude = lng;
          r.imagePath = null;
          r.audioPath = null;
          r.isCancelled = false;
          r.status = 0;
        });
      });

      const questions = await loadQuestionsFromDB(localSurvey.id);

      await new Promise((res) => setTimeout(res, 800));

      set({
        isActive: true,
        isTestMode: false,
        isCancelled: false,
        isLoading: false,
        currentIndex: 0,
        questions,
        answers: {},
        activeRespondentId: respondent!.id,
        activeSurveyLocalId: localSurvey.id,
      });
    } catch (err) {
      console.error('[SurveyStore] Error al iniciar encuesta real:', err);
      set({ isLoading: false });
    }
  },

  // ── Iniciar encuesta de PRUEBA (no guarda en BD) ──────────────────────────
  startTestSurvey: async (demographics) => {
    set({ isLoading: true, showForm: false });

    try {
      const surveys = await database
        .get<Survey>('surveys')
        .query(Q.where('status', 1))
        .fetch();
      const localSurvey = surveys[0];

      if (!localSurvey) {
        set({ isLoading: false });
        return;
      }

      const questions = await loadQuestionsFromDB(localSurvey.id);

      await new Promise((res) => setTimeout(res, 800));

      set({
        isActive: true,
        isTestMode: true,
        isCancelled: false,
        isLoading: false,
        currentIndex: 0,
        questions,
        answers: {},
        activeRespondentId: null,
        activeSurveyLocalId: localSurvey.id,
      });
    } catch (err) {
      console.error('[SurveyStore] Error al iniciar prueba:', err);
      set({ isLoading: false });
    }
  },

  // ── Guardar respuesta (persiste en WatermelonDB si no es modo prueba) ──────
  setAnswer: async (questionId, answer) => {
    // Actualizar estado Zustand inmediatamente (UI reactiva)
    set((state) => ({ answers: { ...state.answers, [questionId]: answer } }));

    const { isTestMode, activeRespondentId, questions } = get();
    if (isTestMode || !activeRespondentId) return;

    // Persistir en BD en background
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      persistAnswer(activeRespondentId, question, answer).catch((e) =>
        console.error('[SurveyStore] Error persistiendo respuesta:', e)
      );
    }
  },

  nextQuestion: () =>
    set((state) => {
      if (state.currentIndex < state.questions.length) {
        return { currentIndex: state.currentIndex + 1 };
      }
      return state;
    }),

  prevQuestion: () =>
    set((state) => {
      if (state.currentIndex > 0) {
        return { currentIndex: state.currentIndex - 1 };
      }
      return state;
    }),

  // ── Cancelar encuesta ─────────────────────────────────────────────────────
  cancelSurvey: async () => {
    const state = get();

    // Detener grabación de audio
    await AudioRecorderService.stopRecording().catch(console.error);

    // Borrar respondent incompleto si existe (solo encuestas reales)
    if (!state.isTestMode && state.activeRespondentId) {
      try {
        await database.write(async () => {
          const respondent = await database
            .get<Respondent>('respondents')
            .find(state.activeRespondentId);
          await respondent.destroyPermanently();
        });
      } catch (e) {
        console.error('[SurveyStore] Error borrando respondent cancelado:', e);
      }
    }

    // Reset completo del store — vuelve al dashboard
    set({
      isActive: false,
      isTestMode: false,
      isCancelled: false,
      isLoading: false,
      showForm: false,
      currentIndex: 0,
      questions: [],
      answers: {},
      activeRespondentId: null,
      activeSurveyLocalId: null,
    });
  },

  // ── Finalizar encuesta (guarda foto + audio, cierra registro) ─────────────
  endSurvey: async (photoUri, audioUri) => {
    const { isTestMode, activeRespondentId } = get();

    // Detener grabación de audio
    const finalAudio = audioUri ?? (await AudioRecorderService.stopRecording().catch(() => null));

    if (!isTestMode && activeRespondentId) {
      // Actualizar el Respondent con rutas de archivos y status=1 (listo para subir)
      await database.write(async () => {
        const respondent = await database
          .get<Respondent>('respondents')
          .find(activeRespondentId);
        await respondent.update((r) => {
          // Quitar "file://" prefix porque RNFS trabaja con paths absolutos sin protocolo
          r.imagePath = photoUri?.replace('file://', '') ?? null;
          r.audioPath = finalAudio?.replace('file://', '') ?? null;
          r.status = 1;
        });
      });
    }

    set({
      isActive: false,
      isTestMode: false,
      isCancelled: false,
      isLoading: false,
      showForm: false,
      currentIndex: 0,
      questions: [],
      answers: {},
      activeRespondentId: null,
      activeSurveyLocalId: null,
    });
  },
}));
