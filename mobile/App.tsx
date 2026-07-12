import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from './src/features/auth/store';
import { useSurveyStore } from './src/features/survey/store';
import LoginScreen from './src/features/auth/LoginScreen';
import PermissionsScreen from './src/features/permissions/PermissionsScreen';
import DashboardScreen from './src/features/dashboard/DashboardScreen';
import SurveyContainer from './src/features/survey/SurveyContainer';
import RespondentFormScreen from './src/features/survey/RespondentFormScreen';

export default function App() {
  const { token, isLoading, checkSession } = useAuthStore();
  const { isActive, showForm, closeForm } = useSurveyStore();
  const [hasPermissions, setHasPermissions] = React.useState(false);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  // Flujo No Autenticado
  if (!token) {
    return (
      <>
        <LoginScreen />
        <StatusBar style="light" />
      </>
    );
  }

  // Flujo de Permisos (primera vez)
  if (!hasPermissions) {
    return (
      <>
        <PermissionsScreen onComplete={() => setHasPermissions(true)} />
        <StatusBar style="dark" />
      </>
    );
  }

  // Encuesta activa → flujo de cuestionario
  if (isActive) {
    return (
      <>
        <SurveyContainer />
        <StatusBar style="light" />
      </>
    );
  }

  // Formulario demográfico previo a la encuesta
  if (showForm) {
    return (
      <>
        <RespondentFormScreen onBack={closeForm} />
        <StatusBar style="light" />
      </>
    );
  }

  // Dashboard principal
  return (
    <>
      <DashboardScreen />
      <StatusBar style="light" />
    </>
  );
}
