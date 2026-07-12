/**
 * EmergencyPanel — Panel de Emergencia (REQ-EXEC-06 y REQ-EXEC-07)
 * Usa expo-file-system en lugar de react-native-fs.
 */

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { database } from '../../database';
import Survey from '../../database/models/Survey';
import Question from '../../database/models/Question';
import Option from '../../database/models/Option';
import SubOption from '../../database/models/SubOption';
import Respondent from '../../database/models/Respondent';
import Answer from '../../database/models/Answer';
import { syncAssignment } from '../../services/SyncService';
import { X, ShieldAlert, Download, RefreshCw } from 'lucide-react-native';
import CustomModal from '../../components/ui/CustomModal';

if (!process.env.EXPO_PUBLIC_EMERGENCY_PASSWORD) {
  throw new Error('[EmergencyPanel] EXPO_PUBLIC_EMERGENCY_PASSWORD env var is not set');
}
const EMERGENCY_PASSWORD = process.env.EXPO_PUBLIC_EMERGENCY_PASSWORD;

interface EmergencyPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmergencyPanel({ visible, onClose }: EmergencyPanelProps) {
  const [step, setStep] = useState<'auth' | 'panel'>('auth');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [resultModal, setResultModal] = useState<{ title: string; msg: string } | null>(null);

  const handleAuth = () => {
    if (password === EMERGENCY_PASSWORD) {
      setStep('panel');
      setAuthError('');
    } else {
      setAuthError('Contraseña incorrecta.');
    }
  };

  const handleClose = () => {
    setStep('auth');
    setPassword('');
    setAuthError('');
    onClose();
  };

  // REQ-EXEC-06 — Exportar BD local a JSON
  const handleExportDB = async () => {
    setIsWorking(true);
    try {
      const [surveys, questions, options, subOptions, respondents, answers] = await Promise.all([
        database.get<Survey>('surveys').query().fetch(),
        database.get<Question>('questions').query().fetch(),
        database.get<Option>('options').query().fetch(),
        database.get<SubOption>('sub_options').query().fetch(),
        database.get<Respondent>('respondents').query().fetch(),
        database.get<Answer>('answers').query().fetch(),
      ]);

      const dump = {
        exportedAt: new Date().toISOString(),
        surveys: surveys.map((r) => r._raw),
        questions: questions.map((r) => r._raw),
        options: options.map((r) => r._raw),
        subOptions: subOptions.map((r) => r._raw),
        respondents: respondents.map((r) => r._raw),
        answers: answers.map((r) => r._raw),
      };

      const filename = `cdh_backup_${Date.now()}.json`;
      // expo-file-system: guardar en el directorio de documentos de la app
      const path = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(dump, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setResultModal({
        title: '✅ Exportación exitosa',
        msg: `Archivo guardado en:\n${path}\n\nPuede accederse mediante el explorador de archivos o ADB.`,
      });
    } catch (e: any) {
      setResultModal({ title: '❌ Error al exportar', msg: e.message });
    } finally {
      setIsWorking(false);
    }
  };

  // REQ-EXEC-07 — Re-sincronizar localmente
  const handleRecoverProgress = async () => {
    setIsWorking(true);
    try {
      const result = await syncAssignment();
      if (result.type === 'downloaded' || result.type === 'up_to_date') {
        setResultModal({
          title: '✅ Recuperación completada',
          msg: 'El progreso local ha sido restaurado desde el servidor.',
        });
      } else if (result.type === 'error') {
        setResultModal({ title: '❌ Error de red', msg: result.message });
      } else {
        setResultModal({ title: 'ℹ️ Sin cambios', msg: 'No se encontraron datos nuevos para recuperar.' });
      }
    } catch (e: any) {
      setResultModal({ title: '❌ Error', msg: e.message });
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-background/95 justify-end">
        <View className="bg-card border-t border-border rounded-t-3xl p-6 pb-10">

          {resultModal && (
            <CustomModal
              visible
              title={resultModal.title}
              description={resultModal.msg}
              type="info"
              confirmText="Aceptar"
              onConfirm={() => setResultModal(null)}
              onCancel={undefined}
            />
          )}

          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <ShieldAlert color="#EF4444" size={22} style={{ marginRight: 10 }} />
              <Text className="text-foreground text-lg font-black">Panel de Emergencia</Text>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
              <X color="#64748B" size={24} />
            </TouchableOpacity>
          </View>

          {step === 'auth' ? (
            <View>
              <Text className="text-muted-foreground text-sm mb-4 leading-relaxed">
                Esta sección es solo para uso técnico. Ingresa la contraseña de emergencia para continuar.
              </Text>
              <View className="bg-background border border-input rounded-xl px-4 mb-3">
                <TextInput
                  className="text-foreground text-base py-4"
                  placeholder="Contraseña de emergencia"
                  placeholderTextColor="#64748B"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onSubmitEditing={handleAuth}
                />
              </View>
              {!!authError && (
                <Text className="text-destructive text-sm mb-3 font-medium">{authError}</Text>
              )}
              <TouchableOpacity
                className="w-full bg-destructive py-4 rounded-xl items-center justify-center active:opacity-80"
                onPress={handleAuth}
              >
                <Text className="text-white font-black text-base">Ingresar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView>
              <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-4">
                Acciones disponibles
              </Text>

              {isWorking && (
                <View className="items-center py-6">
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="text-muted-foreground mt-3 font-medium">Procesando...</Text>
                </View>
              )}

              {!isWorking && (
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    className="bg-background border border-border rounded-2xl p-5 flex-row items-center active:opacity-80"
                    onPress={handleExportDB}
                  >
                    <View className="w-12 h-12 bg-primary/20 rounded-full items-center justify-center mr-4">
                      <Download color="#3B82F6" size={22} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-black text-base mb-1">Exportar Base de Datos</Text>
                      <Text className="text-muted-foreground text-sm leading-snug">
                        Guarda un respaldo JSON de todos los registros locales en el almacenamiento de la app.
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-background border border-border rounded-2xl p-5 flex-row items-center active:opacity-80"
                    onPress={handleRecoverProgress}
                  >
                    <View className="w-12 h-12 bg-accent/20 rounded-full items-center justify-center mr-4">
                      <RefreshCw color="#CA5D1E" size={22} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-foreground font-black text-base mb-1">Recuperar Progreso</Text>
                      <Text className="text-muted-foreground text-sm leading-snug">
                        Re-sincroniza la encuesta desde el servidor para restaurar el estado visible.
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
