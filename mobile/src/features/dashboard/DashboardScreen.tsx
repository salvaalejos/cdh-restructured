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
  Modal, ScrollView,
} from 'react-native';
import EmergencyPanel from './EmergencyPanel';
import DashboardHeader from './DashboardHeader';
import EmptyCampaignView from './EmptyCampaignView';
import CampaignInfoCard from './CampaignInfoCard';
import CampaignProgress from './CampaignProgress';
import ActionButtons from './ActionButtons';
import DeleteProgressButton from './DeleteProgressButton';
import { useAuthStore } from '../auth/store';
import { useSurveyStore } from '../survey/store';
import { LogOut } from 'lucide-react-native';
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

const handleDeleteAll = async () => {
  await clearAllLocalData();
  useSurveyStore.setState({
    isActive: false, isTestMode: false, isCancelled: false, isLoading: false,
    showForm: false, currentIndex: 0, questions: [], answers: {},
    activeRespondentId: null, activeSurveyLocalId: null,
  });
};

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [progress, setProgress] = useState({ men: 0, women: 0, total: 0 });

  const refreshStats = useCallback(async () => {
    if (!localSurvey) return;
    const [p, prog] = await Promise.all([getPendingCount(), getLocalProgress(localSurvey.id)]);
    setPendingCount(p);
    setProgress(prog);
  }, [localSurvey]);

  useEffect(() => { refreshStats(); }, [refreshStats, completedCount]);

  const showSuccess = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'success', confirmText: 'Aceptar', onConfirm: () => setModalConfig(null), onCancel: undefined });
  const showInfo = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'info', confirmText: 'Entendido', onConfirm: () => setModalConfig(null), onCancel: undefined });
  const showError = (title: string, description: string) =>
    setModalConfig({ visible: true, title, description, type: 'destructive', confirmText: 'Aceptar', onConfirm: () => setModalConfig(null), onCancel: undefined });

  const confirmStartSurvey = (isTest: boolean) => {
    setModalConfig({
      visible: true,
      title: isTest ? 'Encuesta de Prueba' : 'Empezar Encuesta',
      description: 'Se recopilarán los datos del encuestado y se iniciará la grabación de audio. ¿Deseas continuar?' + (isTest ? ' (Modo prueba — no se guardará nada)' : ''),
      type: 'info', confirmText: 'Sí, Comenzar',
      onCancel: () => setModalConfig(null),
      onConfirm: async () => { setModalConfig(null); await openForm({ isTest }); },
    });
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result: SyncStatus = await syncAssignment();
      if (result.type === 'up_to_date') {
        showInfo('Ya sincronizado', 'Tu encuesta ya está al día. No hay cambios en el servidor.');
      } else if (result.type === 'downloaded') {
        showSuccess('¡Encuesta descargada!', `Campaña "${result.survey.title}" lista para trabajar sin conexión.`);
      } else if (result.type === 'conflict') {
        setModalConfig({
          visible: true, title: 'Cambio de Campaña',
          description: `Tienes registros pendientes de "${result.localSurveyTitle}". Si cambias a "${result.newSurveyTitle}", el progreso pendiente se perderá. ¿Deseas continuar?`,
          type: 'destructive', confirmText: 'Sí, Cambiar', cancelText: 'Cancelar',
          onCancel: () => setModalConfig(null),
          onConfirm: async () => {
            setModalConfig(null); setIsSyncing(true);
            await clearLocalSurvey();
            const r2 = await forceDownload();
            setIsSyncing(false);
            if (r2.type === 'downloaded') showSuccess('¡Nueva campaña!', `Campaña "${r2.survey.title}" descargada correctamente.`);
          },
        });
      } else if (result.type === 'no_assignment') {
        showInfo('Sin asignación', 'No tienes ninguna encuesta asignada actualmente. Contacta al administrador.');
      } else if (result.type === 'error') {
        showInfo('Sin conexión', `${result.message}. Verifica tu conexión a la red y vuelve a intentar.`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpload = () => {
    if (pendingCount === 0) {
      showInfo('Sin registros pendientes', 'No tienes encuestas completadas pendientes de subir.');
      return;
    }
    setModalConfig({
      visible: true, title: 'Subir Encuestas',
      description: `Se subirán ${pendingCount} registro(s) al servidor. Esta acción puede tardar según la conexión. Los registros exitosos se eliminarán del dispositivo.`,
      type: 'destructive', confirmText: 'Sí, Subir', cancelText: 'Cancelar',
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null); setIsUploading(true);
        setUploadProgress({ total: pendingCount, completed: 0, failed: 0, current: 0 });
        const result = await uploadPendingRespondents((p) => setUploadProgress(p));
        setIsUploading(false); setUploadProgress(null); await refreshStats();
        if (result.failed === 0) {
          showSuccess('¡Subida Completada!', `${result.uploaded} encuesta(s) subidas correctamente.`);
        } else {
          showError('Subida Parcial', `${result.uploaded} subidas, ${result.failed} fallaron y permanecen en el dispositivo para reintentar.`);
        }
      },
    });
  };

  const remainingMen = Math.max(0, (localSurvey?.menCount ?? 0) - (localSurvey?.serverCompletedMen ?? 0));
  const remainingWomen = Math.max(0, (localSurvey?.womenCount ?? 0) - (localSurvey?.serverCompletedWomen ?? 0));
  const remainingTotal = remainingMen + remainingWomen;

  return (
    <View className="flex-1 bg-background px-6 pt-16 pb-8">
      {/* Spinner de inicio de encuesta */}
      <Modal transparent visible={isSurveyLoading} animationType="fade">
        <View className="flex-1 bg-background/80 items-center justify-center">
          <View className="bg-card p-8 rounded-3xl items-center shadow-2xl border border-border mx-8 w-[80%] max-w-sm">
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginBottom: 24 }} />
            <Text className="text-foreground font-black text-xl text-center tracking-tight mb-2">Preparando encuesta</Text>
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
            <Text className="text-foreground font-black text-xl text-center tracking-tight mb-2">Subiendo Encuestas</Text>
            {uploadProgress && uploadProgress.completed > 0 && (
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

      <DashboardHeader
        userName={user?.name || user?.username || 'Encuestador'}
        pendingCount={pendingCount}
        onLongPressAvatar={() => setShowEmergency(true)}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {!localSurvey ? (
          <EmptyCampaignView isSyncing={isSyncing} onSync={handleSync} />
        ) : (
          <View>
            <CampaignInfoCard survey={localSurvey} />
            <CampaignProgress
              progress={progress}
              remainingMen={remainingMen}
              remainingWomen={remainingWomen}
              remainingTotal={remainingTotal}
            />
            <ActionButtons
              isSurveyLoading={isSurveyLoading}
              isSyncing={isSyncing}
              isUploading={isUploading}
              pendingCount={pendingCount}
              onStartSurvey={() => confirmStartSurvey(false)}
              onStartTest={() => confirmStartSurvey(true)}
              onUpload={handleUpload}
              onSync={handleSync}
            />
          </View>
        )}
      </ScrollView>

      <DeleteProgressButton onDelete={handleDeleteAll} />

      {/* Cerrar sesión */}
      <TouchableOpacity
        className="w-full bg-transparent py-4 rounded-2xl items-center justify-center flex-row border border-destructive/30 active:bg-destructive/10 mt-4"
        onPress={() => setShowLogoutModal(true)}
      >
        <LogOut color="#EF4444" size={18} style={{ marginRight: 12 }} />
        <Text className="text-destructive font-bold text-sm tracking-wide">Cerrar Sesión</Text>
      </TouchableOpacity>

      <CustomModal
        visible={showLogoutModal}
        title="Cerrar Sesión"
        description="Se eliminarán todos los datos locales incluyendo encuestas descargadas, registros pendientes y archivos multimedia. ¿Deseas continuar?"
        type="destructive"
        confirmText="Sí, Cerrar Sesión"
        onConfirm={async () => {
          setShowLogoutModal(false);
          await clearAllLocalData().catch(console.error);
          useSurveyStore.setState({
            isActive: false, isTestMode: false, isCancelled: false, isLoading: false,
            showForm: false, currentIndex: 0, questions: [], answers: {},
            activeRespondentId: null, activeSurveyLocalId: null,
          });
          await logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
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
      // @ts-ignore
      require('rxjs/operators').map((arr: Survey[]) => arr[0] ?? null)
    ),
  completedCount: database
    .get<Respondent>('respondents')
    .query(Q.where('status', Q.gte(1)))
    .observeCount(),
}));

// @ts-ignore
const Dashboard = enhance(DashboardInner) as React.ComponentType;
export default Dashboard;
