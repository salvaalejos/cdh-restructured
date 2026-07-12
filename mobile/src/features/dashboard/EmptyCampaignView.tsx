import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CloudDownload, DatabaseBackup, Wifi } from 'lucide-react-native';

interface EmptyCampaignViewProps {
  isSyncing: boolean;
  onSync: () => void;
}

export default function EmptyCampaignView({ isSyncing, onSync }: EmptyCampaignViewProps) {
  return (
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
        onPress={onSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator size="large" color="#F8FAFC" style={{ marginBottom: 16 }} />
        ) : (
          <View className="bg-background/20 p-4 rounded-full mb-4">
            <CloudDownload color="#F8FAFC" size={48} strokeWidth={1.5} />
          </View>
        )}
        <Text className="text-white text-2xl font-black tracking-wide">
          {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
        </Text>
        <Text className="text-white/80 text-sm mt-2 font-medium">
          Descargar encuesta asignada
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="w-full bg-secondary py-5 rounded-2xl items-center justify-center flex-row active:opacity-80 border border-border"
        onPress={onSync}
        disabled={isSyncing}
      >
        <DatabaseBackup color="#F8FAFC" size={20} style={{ marginRight: 12 }} />
        <Text className="text-secondary-foreground text-base font-bold tracking-wide">
          Recuperar Progreso Local
        </Text>
      </TouchableOpacity>
    </View>
  );
}
