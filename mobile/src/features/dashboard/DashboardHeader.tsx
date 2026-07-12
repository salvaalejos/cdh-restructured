import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { User } from 'lucide-react-native';

interface DashboardHeaderProps {
  userName: string;
  pendingCount: number;
  onLongPressAvatar: () => void;
}

export default function DashboardHeader({ userName, pendingCount, onLongPressAvatar }: DashboardHeaderProps) {
  return (
    <View className="flex-row items-center mb-8">
      <TouchableOpacity
        className="w-14 h-14 bg-secondary rounded-full items-center justify-center mr-4 border border-border"
        onLongPress={onLongPressAvatar}
        delayLongPress={1500}
        activeOpacity={1}
      >
        <User color="#F8FAFC" size={28} />
      </TouchableOpacity>
      <View className="flex-1">
        <Text className="text-muted-foreground text-sm font-medium">Bienvenido de vuelta,</Text>
        <Text className="text-foreground text-2xl font-extrabold tracking-tight" numberOfLines={1}>
          {userName}
        </Text>
      </View>
      {pendingCount > 0 && (
        <View className="bg-accent/20 border border-accent/50 px-3 py-1 rounded-full">
          <Text className="text-accent text-xs font-bold">{pendingCount} pendientes</Text>
        </View>
      )}
    </View>
  );
}
