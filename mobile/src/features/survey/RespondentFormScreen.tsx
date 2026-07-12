/**
 * RespondentFormScreen
 *
 * Pantalla previa a las preguntas de la encuesta.
 * Recolecta los datos demográficos del encuestado:
 *   - Género (Hombre / Mujer)
 *   - Edad (numérico, 1–120)
 *   - Escolaridad (selector de opciones)
 *
 * Al confirmar, crea el Respondent en WatermelonDB con status=0 (en progreso)
 * e inicia el flujo real de preguntas.
 */

import React, { useState } from 'react';
import {
  View, Text, Pressable, TextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { User, Mars, Venus, GraduationCap, ArrowRight } from 'lucide-react-native';
import { useSurveyStore } from './store';
import CustomModal from '../../components/ui/CustomModal';

const SCHOOLING_OPTIONS = [
  'Sin escolaridad',
  'Primaria',
  'Secundaria',
  'Preparatoria',
  'Licenciatura',
  'Posgrado',
];

type Gender = 'Hombre' | 'Mujer' | null;

interface RespondentFormScreenProps {
  onBack: () => void;
}

export default function RespondentFormScreen({ onBack }: RespondentFormScreenProps) {
  const { startRealSurvey, startTestSurvey, isTestMode, isLoading } = useSurveyStore();

  const [gender, setGender] = useState<Gender>(null);
  const [ageText, setAgeText] = useState('');
  const [schooling, setSchooling] = useState<string | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const isValid = gender !== null && ageText.trim() !== '' && schooling !== null;
  const age = parseInt(ageText, 10);

  const handleStart = async () => {
    if (!isValid) return;

    if (isNaN(age) || age < 1 || age > 120) {
      setErrorModal('Por favor ingresa una edad válida (1–120).');
      return;
    }

    const demographics = { gender: gender!, age, schooling: schooling! };
    if (isTestMode) {
      await startTestSurvey(demographics);
    } else {
      await startRealSurvey(demographics);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-muted-foreground mt-4 font-medium">
          Iniciando encuesta...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {isTestMode && (
        <View className="bg-destructive px-4 py-2 rounded-xl mb-4 items-center justify-center">
          <Text className="text-destructive-foreground font-black text-xs uppercase tracking-widest">
            Modo de Prueba — No se guardará ningún dato
          </Text>
        </View>
      )}

      {errorModal && (
        <CustomModal
          visible
          title="Datos inválidos"
          description={errorModal}
          type="destructive"
          confirmText="Entendido"
          onConfirm={() => setErrorModal(null)}
          onCancel={undefined}
        />
      )}

      <CustomModal
        visible={showCancelModal}
        title="Cancelar Encuesta"
        description="Se detendrá la grabación de audio y perderás todo el progreso. ¿Deseas continuar?"
        type="destructive"
        confirmText="Sí, Cancelar"
        onConfirm={() => {
          setShowCancelModal(false);
          onBack();
        }}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* Header */}
      <View className="items-center mb-10">
        <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
          <User color="#3B82F6" size={32} />
        </View>
        <Text className="text-foreground text-3xl font-black text-center tracking-tight">
          Datos del Encuestado
        </Text>
        <Text className="text-muted-foreground text-sm text-center mt-2 leading-relaxed">
          Completa la información demográfica antes de iniciar el cuestionario.
        </Text>
      </View>

      {/* Género */}
      <View className="mb-8">
        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
          Género
        </Text>
        <View className="flex-row gap-3">
          {(['Hombre', 'Mujer'] as Gender[]).map((g) => {
            const isSelected = gender === g;
            const Icon = g === 'Hombre' ? Mars : Venus;
            const iconColor = g === 'Hombre' ? '#3B82F6' : '#EC4899';
            const selectedBg = g === 'Hombre'
              ? 'rgba(59,130,246,0.12)'
              : 'rgba(236,72,153,0.12)';
            const selectedBorder = g === 'Hombre' ? '#3B82F6' : '#EC4899';

            return (
              <Pressable
                key={g}
                className="flex-1 py-5 rounded-2xl items-center justify-center border-2"
                style={({ pressed }) => ({
                  backgroundColor: isSelected ? selectedBg : '#1E293B',
                  borderColor: isSelected ? selectedBorder : 'rgba(100, 116, 139, 0.3)',
                  opacity: pressed ? 0.8 : 1,
                })}
                onPress={() => setGender(g)}
              >
                <Icon
                  color={isSelected ? selectedBorder : '#F8FAFC'}
                  size={28}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  className="font-bold text-base"
                  style={{ color: isSelected ? selectedBorder : '#F8FAFC' }}
                >
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Edad */}
      <View className="mb-8">
        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
          Edad
        </Text>
        <View className="bg-card border border-input rounded-xl px-4">
          <TextInput
            className="text-foreground text-xl py-4 font-bold"
            placeholder="Ej. 35"
            placeholderTextColor="#64748B"
            keyboardType="numeric"
            maxLength={3}
            value={ageText}
            onChangeText={setAgeText}
          />
        </View>
      </View>

      {/* Escolaridad */}
      <View className="mb-10">
        <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-3">
          Escolaridad
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {SCHOOLING_OPTIONS.map((opt) => {
            const isSelected = schooling === opt;
            return (
              <Pressable
                key={opt}
                className="px-4 py-2 rounded-full border"
                style={({ pressed }) => ({
                  backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : '#1E293B',
                  borderColor: isSelected ? '#3B82F6' : 'rgba(100, 116, 139, 0.3)',
                  opacity: pressed ? 0.8 : 1,
                })}
                onPress={() => setSchooling(opt)}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{ color: isSelected ? '#3B82F6' : '#F8FAFC' }}
                >
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Actions */}
      <Pressable
        className="w-full py-5 rounded-2xl flex-row items-center justify-center mb-4 shadow-lg"
        style={({ pressed }) => ({
          backgroundColor: isValid ? '#3B82F6' : 'rgba(100, 116, 139, 0.3)',
          opacity: isValid ? (pressed ? 0.8 : 1) : 0.5,
        })}
        onPress={handleStart}
        disabled={!isValid}
      >
        <ArrowRight color="#F8FAFC" size={22} style={{ marginRight: 10 }} />
        <Text className="text-white font-black text-lg tracking-wide">
          Iniciar Encuesta
        </Text>
      </Pressable>

      <Pressable
        className="w-full py-4 rounded-2xl items-center justify-center border border-border"
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        onPress={() => setShowCancelModal(true)}
      >
        <Text className="text-muted-foreground font-semibold">Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}
