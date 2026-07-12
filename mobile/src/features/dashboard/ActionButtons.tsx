import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, UploadCloud, Beaker, RefreshCw } from 'lucide-react-native';

interface ActionButtonsProps {
  isSurveyLoading: boolean;
  isSyncing: boolean;
  isUploading: boolean;
  pendingCount: number;
  onStartSurvey: () => void;
  onStartTest: () => void;
  onUpload: () => void;
  onSync: () => void;
}

export default function ActionButtons({
  isSurveyLoading, isSyncing, isUploading, pendingCount,
  onStartSurvey, onStartTest, onUpload, onSync,
}: ActionButtonsProps) {
  return (
    <View className="mb-6">
      <TouchableOpacity
        className="w-full bg-primary py-4 rounded-xl items-center justify-center flex-row shadow-lg active:opacity-80 mb-3"
        onPress={onStartSurvey}
        disabled={isSurveyLoading}
      >
        <Play color="#F8FAFC" size={20} fill="#F8FAFC" style={{ marginRight: 12 }} />
        <Text className="text-white text-lg font-bold tracking-wide">
          Empezar Encuesta
        </Text>
      </TouchableOpacity>
      <View className="flex-row justify-between">
        <TouchableOpacity
          className="w-[31%] bg-secondary py-4 rounded-xl items-center justify-center flex-row border border-border active:opacity-80"
          onPress={onStartTest}
        >
          <Beaker color="#F8FAFC" size={18} style={{ marginRight: 6 }} />
          <Text className="text-secondary-foreground text-sm font-bold">Prueba</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[31%] py-4 rounded-xl items-center justify-center flex-row border active:opacity-80"
          style={{
            backgroundColor: pendingCount > 0 ? 'rgba(202,93,30,0.12)' : 'transparent',
            borderColor: pendingCount > 0 ? '#CA5D1E' : '#1E293B',
          }}
          onPress={onUpload}
          disabled={isUploading}
        >
          <UploadCloud color={pendingCount > 0 ? '#CA5D1E' : '#F8FAFC'} size={18} style={{ marginRight: 6 }} />
          <Text className="text-sm font-bold" style={{ color: pendingCount > 0 ? '#CA5D1E' : '#F8FAFC' }}>
            Subir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-[31%] bg-card py-4 rounded-xl items-center justify-center flex-row border border-border active:opacity-80"
          onPress={onSync}
          disabled={isSyncing}
        >
          <RefreshCw color="#64748B" size={18} style={{ marginRight: 6 }} />
          <Text className="text-muted-foreground text-sm font-bold">Sync</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
