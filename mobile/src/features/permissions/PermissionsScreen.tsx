import React, { useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { usePermissions } from './usePermissions';
import { Camera, Mic, MapPin, Bell, CheckCircle2, CircleDashed } from 'lucide-react-native';

const isGranted = (status: string) => status === 'granted';

export default function PermissionsScreen({ onComplete }: { onComplete: () => void }) {
  const { permissions, isChecking, requestAllPermissions, checkPermissions } = usePermissions();

  const handleRequest = async () => {
    await requestAllPermissions();
    const allGranted = await checkPermissions();
    if (allGranted) {
      onComplete();
    }
  };

  useEffect(() => {
    if (permissions.allGranted) {
      onComplete();
    }
  }, [permissions.allGranted, onComplete]);

  if (isChecking) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }


  if (permissions.allGranted) {
    return null;
  }

  return (
    <View className="flex-1 bg-background justify-center px-6">
      
      {/* Header Area */}
      <View className="mb-10 mt-8">
        <View className="w-16 h-16 bg-primary/20 rounded-2xl items-center justify-center mb-6 border border-primary/30">
          <Bell color="#3B82F6" size={32} strokeWidth={2} />
        </View>
        <Text className="text-3xl font-extrabold text-foreground mb-3 tracking-tight">
          Configuración Requerida
        </Text>
        <Text className="text-muted-foreground text-sm leading-6 pr-4">
          La plataforma opera <Text className="font-bold text-foreground">100% offline</Text> para proteger la captura de datos. Habilita los siguientes accesos para continuar.
        </Text>
      </View>

      {/* Cards Area */}
      <View className="space-y-4 mb-10">
        
        {/* Permission Card: Camera */}
        <View className="bg-card p-5 rounded-2xl border border-border flex-row items-center">
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isGranted(permissions.camera) ? 'bg-primary/20' : 'bg-secondary'}`}>
            <Camera color={isGranted(permissions.camera) ? '#3B82F6' : '#94A3B8'} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">Cámara</Text>
            <Text className="text-muted-foreground text-xs mt-0.5 leading-4">Fotografías y captura de INEs</Text>
          </View>
          <View className="ml-2">
            {isGranted(permissions.camera) ? 
              <CheckCircle2 color="#3B82F6" size={24} /> : 
              <CircleDashed color="#475569" size={24} />}
          </View>
        </View>

        {/* Permission Card: Microphone */}
        <View className="bg-card p-5 rounded-2xl border border-border flex-row items-center mt-3">
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isGranted(permissions.microphone) ? 'bg-primary/20' : 'bg-secondary'}`}>
            <Mic color={isGranted(permissions.microphone) ? '#3B82F6' : '#94A3B8'} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">Micrófono</Text>
            <Text className="text-muted-foreground text-xs mt-0.5 leading-4">Auditoría en tiempo real</Text>
          </View>
          <View className="ml-2">
            {isGranted(permissions.microphone) ? 
              <CheckCircle2 color="#3B82F6" size={24} /> : 
              <CircleDashed color="#475569" size={24} />}
          </View>
        </View>

        {/* Permission Card: Location */}
        <View className="bg-card p-5 rounded-2xl border border-border flex-row items-center mt-3">
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isGranted(permissions.location) ? 'bg-primary/20' : 'bg-secondary'}`}>
            <MapPin color={isGranted(permissions.location) ? '#3B82F6' : '#94A3B8'} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">Ubicación GPS</Text>
            <Text className="text-muted-foreground text-xs mt-0.5 leading-4">Georeferenciación de encuestas</Text>
          </View>
          <View className="ml-2">
            {isGranted(permissions.location) ? 
              <CheckCircle2 color="#3B82F6" size={24} /> : 
              <CircleDashed color="#475569" size={24} />}
          </View>
        </View>

        {/* Permission Card: Notifications */}
        <View className="bg-card p-5 rounded-2xl border border-border flex-row items-center mt-3">
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${isGranted(permissions.notifications) ? 'bg-primary/20' : 'bg-secondary'}`}>
            <Bell color={isGranted(permissions.notifications) ? '#3B82F6' : '#94A3B8'} size={24} strokeWidth={2} />
          </View>
          <View className="flex-1">
            <Text className="text-foreground text-base font-bold">Segundo Plano</Text>
            <Text className="text-muted-foreground text-xs mt-0.5 leading-4">Mantiene la app viva y grabando</Text>
          </View>
          <View className="ml-2">
            {isGranted(permissions.notifications) ? 
              <CheckCircle2 color="#3B82F6" size={24} /> : 
              <CircleDashed color="#475569" size={24} />}
          </View>
        </View>

      </View>

      <Pressable 
        className="w-full bg-primary py-4 rounded-xl items-center"
        onPress={handleRequest}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Text className="text-primary-foreground font-bold text-base">
          Habilitar Sensores
        </Text>
      </Pressable>
    </View>
  );
}
