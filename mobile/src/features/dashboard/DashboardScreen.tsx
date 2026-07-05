/**
 * DashboardScreen
 *
 * Pantalla principal del encuestador. Conectada a:
 *  - WatermelonDB para leer la campaña activa y el progreso local.
 *  - SyncService para descargar la encuesta asignada.
 *  - UploadService para subir los registros completados.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, TextInput,
} from 'react-native';
import EmergencyPanel from './EmergencyPanel';
import { useAuthStore } from '../auth/store';
import { useSurveyStore } from '../survey/store';
import {
  CloudDownload, DatabaseBackup, LogOut, User,
  Play, UploadCloud, Beaker, RefreshCw, CheckCircle2,
  AlertCircle, Wifi, Trash2, AlertTriangle, X,
} from 'lucide-react-native';
import CircularProgress from '../../components/ui/CircularProgress';
import CustomModal from '../../components/ui/CustomModal';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../database';
import { Q } from '@nozbe/watermelondb';
import Survey from '../../database/models/Survey';
import Respondent from '../../database/models/Respondent';
import {
  syncAssignment,
  forceDownload,
  clearLocalSurvey,
  clearAllLocalData,
  SyncStatus,
} from '../../services/SyncService';
import {
  uploadPendingRespondents,
  getLocalProgress,
  getPendingCount,
  UploadProgress,
} from '../../services/UploadService';

// ─── Inner Dashboard con datos reactivos de WatermelonDB ─────────────────────

interface DashboardInnerProps {
  localSurvey: Survey | null;
  completedCount: number;
}

function DashboardInner({ localSurvey, completedCount }: DashboardInnerProps) {
  const { user, logout } = useAuthStore();
  const { openForm, isLoading: isSurveyLoading } = useSurveyStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [progress, setProgress] = useState({ men: 0, women: 0, total: 0 });

  // Cargar el conteo real de pendientes y progreso desde WatermelonDB
  const refreshStats = useCallback(async () => {
    if (!localSurvey) return;
    const [p, prog] = await Promise.all([
      getPendingCount(),
      getLocalProgress(localSurvey.id),
    ]);
    setPendingCount(p);
    setProgress(prog);
  }, [localSurvey]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats, completedCount]);

  // ── Sincronización de bajada ───────────────────────────────────────────────
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result: SyncStatus = await syncAssignment();

      if (result.type === 'up_to_date') {
        showInfoModal('Ya sincronizado', 'Tu encuesta ya está al día. No hay cambios en el servidor.');
      } else if (result.type === 'downloaded') {
        showSuccessModal('¡Encuesta descargada!', `Campaña "${result.survey.title}" lista para trabajar sin conexión.`);
      } else if (result.type === 'conflict') {
        setModalConfig({
          visible: true,
          title: 'Cambio de Campaña',
          description: `Tienes registros pendientes de "${result.localSurveyTitle}". Si cambias a "${result.newSurveyTitle}", el progreso pendiente se perderá. ¿Deseas continuar?`,
          type: 'destructive',
          confirmText: 'Sí, Cambiar',
          cancelText: 'Cancelar',
          onCancel: () => setModalConfig(null),
          onConfirm: async () => {
            setModalConfig(null);
            setIsSyncing(true);
            await clearLocalSurvey();
            const r2 = await forceDownload();
            setIsSyncing(false);
            if (r2.type === 'downloaded') {
              showSuccessModal('¡Nueva campaña!', `Campaña "${r2.survey.title}" descargada correctamente.`);
            }
          },
        });
      } else if (result.type === 'no_assignment') {
        showInfoModal('Sin asignación', 'No tienes ninguna encuesta asignada actualmente. Contacta al administrador.');
      } else if (result.type === 'error') {
        showErrorModal('Error de conexión', result.message);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Subida de resultados ───────────────────────────────────────────────────
  const handleUpload = () => {
    if (pendingCount === 0) {
      showInfoModal('Sin registros pendientes', 'No tienes encuestas completadas pendientes de subir.');
      return;
    }

    setModalConfig({
      visible: true,
      title: 'Subir Encuestas',
      description: `Se subirán ${pendingCount} registro(s) al servidor. Esta acción puede tardar según la conexión. Los registros exitosos se eliminarán del dispositivo.`,
      type: 'destructive',
      confirmText: 'Sí, Subir',
      cancelText: 'Cancelar',
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        setIsUploading(true);
        setUploadProgress({ total: pendingCount, completed: 0, failed: 0, current: 0 });

        const result = await uploadPendingRespondents((p) => setUploadProgress(p));

        setIsUploading(false);
        setUploadProgress(null);
        await refreshStats();

        if (result.failed === 0) {
          showSuccessModal('¡Subida Completada!', `${result.uploaded} encuesta(s) subidas correctamente.`);
        } else {
          showErrorModal(
            'Subida Parcial',
            `${result.uploaded} subidas, ${result.failed} fallaron y permanecen en el dispositivo para reintentar.`
          );
        }
      },
    });
  };

  // ── Helpers de modales ─────────────────────────────────────────────────────
  const showSuccessModal = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'success', confirmText: 'Aceptar', onConfirm: () => setModalConfig(null), onCancel: undefined });

  const showInfoModal = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'info', confirmText: 'Entendido', onConfirm: () => setModalConfig(null), onCancel: undefined });

  const showErrorModal = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'destructive', confirmText: 'Aceptar', onConfirm: () => setModalConfig(null), onCancel: undefined });

  const confirmStartSurvey = (isTest: boolean) => {
    setModalConfig({
      visible: true,
      title: isTest ? 'Encuesta de Prueba' : 'Empezar Encuesta',
      description: 'Se recopilarán los datos del encuestado y se iniciará la grabación de audio. ¿Deseas continuar?' + (isTest ? ' (Modo prueba — no se guardará nada)' : ''),
      type: 'info',
      confirmText: 'Sí, Comenzar',
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        await openForm({ isTest });
      },
    });
  };

  const targetMen = localSurvey?.menCount ?? 0;
  const targetWomen = localSurvey?.womenCount ?? 0;
  const serverMen = localSurvey?.serverCompletedMen ?? 0;
  const serverWomen = localSurvey?.serverCompletedWomen ?? 0;
  const remainingMen = Math.max(0, targetMen - serverMen);
  const remainingWomen = Math.max(0, targetWomen - serverWomen);
  const remainingTotal = remainingMen + remainingWomen;

  return (
    <View className="flex-1 bg-background px-6 pt-16 pb-8">

      {/* Spinner de inicio de encuesta */}
      <Modal transparent visible={isSurveyLoading} animationType="fade">
        <View className="flex-1 bg-background/80 items-center justify-center">
          <View className="bg-card p-8 rounded-3xl items-center shadow-2xl border border-border mx-8 w-[80%] max-w-sm">
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 24 }} />
            <Text className="text-foreground font-black text-xl text-center tracking-tight mb-2">
              Iniciando Sesión
            </Text>
            <Text className="text-muted-foreground text-sm text-center leading-relaxed">
              Configurando permisos de audio y levantando el servicio en segundo plano...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Spinner de subida */}
      <Modal transparent visible={isUploading} animationType="fade">
        <View className="flex-1 bg-background/80 items-center justify-center">
          <View className="bg-card p-8 rounded-3xl items-center shadow-2xl border border-border mx-8 w-[80%] max-w-sm">
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 24 }} />
            <Text className="text-foreground font-black text-xl text-center tracking-tight mb-2">
              Subiendo Encuestas
            </Text>
            {uploadProgress && (
              <Text className="text-muted-foreground text-sm text-center leading-relaxed">
                {uploadProgress.completed} de {uploadProgress.total} registros
                {uploadProgress.failed > 0 ? ` · ${uploadProgress.failed} errores` : ''}
              </Text>
            )}
          </View>
        </View>
      </Modal>

      {modalConfig && <CustomModal {...modalConfig} />}

      <EmergencyPanel visible={showEmergency} onClose={() => setShowEmergency(false)} />

      {/* Header */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity
          className="w-14 h-14 bg-secondary rounded-full items-center justify-center mr-4 border border-border"
          onLongPress={() => setShowEmergency(true)}
          delayLongPress={1500}
          activeOpacity={1}
        >
          <User color="#F8FAFC" size={28} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-muted-foreground text-sm font-medium">Bienvenido de vuelta,</Text>
          <Text className="text-foreground text-2xl font-extrabold tracking-tight" numberOfLines={1}>
            {user?.name || user?.username || 'Encuestador'}
          </Text>
        </View>

        {/* Indicador de registros pendientes */}
        {pendingCount > 0 && (
          <View className="bg-accent/20 border border-accent/50 px-3 py-1 rounded-full">
            <Text className="text-accent text-xs font-bold">{pendingCount} pendientes</Text>
          </View>
        )}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ── Sin encuesta activa ─────────────────────────────────────────── */}
        {!localSurvey ? (
          <View className="items-center pt-8">
            <View className="w-20 h-20 bg-secondary rounded-full items-center justify-center mb-6">
              <Wifi color="#64748B" size={40} strokeWidth={1.5} />
            </View>
            <Text className="text-foreground text-xl font-black text-center mb-2">
              Sin campaña activa
            </Text>
            <Text className="text-muted-foreground text-sm text-center mb-10 leading-relaxed px-4">
              Sincroniza para descargar tu encuesta asignada y comenzar a trabajar sin conexión.
            </Text>

            <TouchableOpacity
              className="w-full bg-primary py-12 rounded-3xl items-center justify-center mb-6 shadow-xl active:opacity-80 border border-primary/50"
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="large" color="#F8FAFC" style={{ marginBottom: 16 }} />
              ) : (
                <View className="bg-background/20 p-4 rounded-full mb-4">
                  <CloudDownload color="#F8FAFC" size={48} strokeWidth={1.5} />
                </View>
              )}
              <Text className="text-primary-foreground text-2xl font-black tracking-wide">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Text>
              <Text className="text-primary-foreground/80 text-sm mt-2 font-medium">
                Descargar encuesta asignada
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full bg-secondary py-5 rounded-2xl items-center justify-center flex-row active:opacity-80 border border-border"
              onPress={handleSync}
              disabled={isSyncing}
            >
              <DatabaseBackup color="#F8FAFC" size={20} style={{ marginRight: 12 }} />
              <Text className="text-secondary-foreground text-base font-bold tracking-wide">
                Recuperar Progreso Local
              </Text>
            </TouchableOpacity>
          </View>

        ) : (
          /* ── Con encuesta activa ──────────────────────────────────────────── */
          <View>
            {/* Card de campaña */}
            <View className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
              <View className="flex-row">
                <View className="w-1.5 bg-primary" />
                <View className="flex-1 p-5">
                  <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
                    Campaña Actual
                  </Text>
                  <Text className="text-foreground text-xl font-black mb-1 leading-tight" numberOfLines={2}>
                    {localSurvey.title}
                  </Text>
                  {localSurvey.description ? (
                    <Text className="text-muted-foreground text-sm leading-relaxed mb-3">
                      {localSurvey.description}
                    </Text>
                  ) : null}
                  {localSurvey.location && (
                    <View className="bg-secondary self-start px-3 py-1 rounded-full">
                      <Text className="text-secondary-foreground text-xs font-bold">
                        📍 {localSurvey.location}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Progreso de metas */}
            <View className="items-center mb-6">
              <View className="flex-row justify-around w-full px-8 mb-6">
                <CircularProgress
                  value={progress.men}
                  max={remainingMen}
                  label="Hombres"
                  color="#3B82F6"
                  size={100}
                />
                <CircularProgress
                  value={progress.women}
                  max={remainingWomen}
                  label="Mujeres"
                  color="#EC4899"
                  size={100}
                />
              </View>
              <CircularProgress
                value={progress.total}
                max={remainingTotal}
                label="Total"
                color="#10B981"
                size={110}
              />
            </View>

            {/* Botones de acción */}
            <View className="mb-6">

              {/* Empezar encuesta real */}
              <TouchableOpacity
                className="w-full bg-primary py-4 rounded-xl items-center justify-center flex-row shadow-lg active:opacity-80 mb-3"
                onPress={() => confirmStartSurvey(false)}
                disabled={isSurveyLoading}
              >
                <Play color="#F8FAFC" size={20} fill="#F8FAFC" style={{ marginRight: 12 }} />
                <Text className="text-primary-foreground text-lg font-bold tracking-wide">
                  Empezar Encuesta
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-between">
                {/* Modo prueba */}
                <TouchableOpacity
                  className="w-[31%] bg-secondary py-4 rounded-xl items-center justify-center flex-row border border-border active:opacity-80"
                  onPress={() => confirmStartSurvey(true)}
                >
                  <Beaker color="#F8FAFC" size={18} style={{ marginRight: 6 }} />
                  <Text className="text-secondary-foreground text-sm font-bold">Prueba</Text>
                </TouchableOpacity>

                {/* Subir */}
                <TouchableOpacity
                  className="w-[31%] py-4 rounded-xl items-center justify-center flex-row border active:opacity-80"
                  style={{
                    backgroundColor: pendingCount > 0 ? 'rgba(202,93,30,0.12)' : 'transparent',
                    borderColor: pendingCount > 0 ? '#CA5D1E' : '#1E293B',
                  }}
                  onPress={handleUpload}
                  disabled={isUploading}
                >
                  <UploadCloud
                    color={pendingCount > 0 ? '#CA5D1E' : '#F8FAFC'}
                    size={18}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className="text-sm font-bold"
                    style={{ color: pendingCount > 0 ? '#CA5D1E' : '#F8FAFC' }}
                  >
                    Subir
                  </Text>
                </TouchableOpacity>

                {/* Sincronizar (re-sync) */}
                <TouchableOpacity
                  className="w-[31%] bg-card py-4 rounded-xl items-center justify-center flex-row border border-border active:opacity-80"
                  onPress={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw
                    color="#64748B"
                    size={18}
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-muted-foreground text-sm font-bold">Sync</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Borrar progreso */}
      <TouchableOpacity
        className="w-full bg-transparent py-4 rounded-2xl items-center justify-center flex-row border border-destructive/30 active:bg-destructive/10 mt-4"
        onPress={() => {
          setDeleteConfirmText('');
          setShowDeleteModal(true);
        }}
      >
        <Trash2 color="#EF4444" size={18} style={{ marginRight: 12 }} />
        <Text className="text-destructive font-bold text-sm tracking-wide">Borrar progreso</Text>
      </TouchableOpacity>

      {/* Cerrar sesión */}
      <TouchableOpacity
        className="w-full bg-transparent py-4 rounded-2xl items-center justify-center flex-row border border-destructive/30 active:bg-destructive/10 mt-4"
        onPress={logout}
      >
        <LogOut color="#EF4444" size={18} style={{ marginRight: 12 }} />
        <Text className="text-destructive font-bold text-sm tracking-wide">Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Modal de confirmación de borrado de progreso */}
      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="w-full bg-card rounded-3xl border border-border p-6 shadow-2xl relative overflow-hidden">
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-destructive" />

            <TouchableOpacity
              className="absolute top-4 right-4 p-2 bg-secondary rounded-full active:opacity-80"
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
            >
              <X color="#64748B" size={18} />
            </TouchableOpacity>

            <View className="items-center mb-6 mt-2">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-destructive/10">
                <AlertTriangle color="#EF4444" size={32} />
              </View>
              <Text className="text-foreground text-2xl font-black text-center mb-2 tracking-tight">
                Borrar todo el progreso
              </Text>
              <Text className="text-muted-foreground text-center text-sm leading-relaxed px-2">
                Esta acción eliminará toda la base de datos local y archivos multimedia, incluyendo encuestas completadas y progreso. Para confirmar, escribe "confirmar".
              </Text>
            </View>

            <TextInput
              className="bg-secondary text-foreground border border-border rounded-xl px-4 py-3.5 mb-6 text-base font-medium"
              placeholder='Escribe "confirmar"'
              placeholderTextColor="#64748B"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View className="flex-row w-full gap-4">
              <TouchableOpacity
                className="flex-1 bg-transparent py-3.5 rounded-xl border border-border items-center justify-center active:bg-secondary"
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
              >
                <Text className="text-muted-foreground font-bold tracking-wide">Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-xl border items-center justify-center shadow-lg ${
                  deleteConfirmText === 'confirmar'
                    ? 'bg-destructive border-destructive shadow-destructive/30'
                    : 'bg-destructive/50 border-destructive/50'
                }`}
                onPress={async () => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                  await clearAllLocalData();
                  useSurveyStore.setState({
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
                }}
                disabled={deleteConfirmText !== 'confirmar'}
              >
                <Text className="text-white font-bold tracking-wide">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Observar cambios reactivos de WatermelonDB ───────────────────────────────

const enhance = withObservables([], () => ({
  localSurvey: database
    .get<Survey>('surveys')
    .query(Q.where('status', 1))
    .observe()
    .pipe(
      // map el array a un solo elemento o null
      // @ts-ignore
      require('rxjs/operators').map((arr: Survey[]) => arr[0] ?? null)
    ),
  completedCount: database
    .get<Respondent>('respondents')
    .query(Q.where('status', Q.gte(1)))
    .observeCount(),
}));

// @ts-ignore
export default enhance(DashboardInner) as React.ComponentType;
