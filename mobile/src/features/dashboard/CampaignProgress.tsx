import React from 'react';
import { View } from 'react-native';
import CircularProgress from '../../components/ui/CircularProgress';

interface CampaignProgressProps {
  progress: { men: number; women: number; total: number };
  remainingMen: number;
  remainingWomen: number;
  remainingTotal: number;
}

export default function CampaignProgress({ progress, remainingMen, remainingWomen, remainingTotal }: CampaignProgressProps) {
  return (
    <View className="items-center mb-6">
      <View className="flex-row justify-around w-full px-8 mb-6">
        <CircularProgress value={progress.men} max={remainingMen} label="Hombres" color="#3B82F6" size={100} />
        <CircularProgress value={progress.women} max={remainingWomen} label="Mujeres" color="#EC4899" size={100} />
      </View>
      <CircularProgress value={progress.total} max={remainingTotal} label="Total" color="#10B981" size={110} />
    </View>
  );
}
