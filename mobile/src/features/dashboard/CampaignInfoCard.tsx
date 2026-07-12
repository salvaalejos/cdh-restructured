import React from 'react';
import { View, Text } from 'react-native';
import Survey from '../../database/models/Survey';

interface CampaignInfoCardProps {
  survey: Survey;
}

export default function CampaignInfoCard({ survey }: CampaignInfoCardProps) {
  return (
    <View className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
      <View className="flex-row">
        <View className="w-1.5 bg-primary" />
        <View className="flex-1 p-5">
          <Text className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">
            Campaña Actual
          </Text>
          <Text className="text-foreground text-xl font-black mb-1 leading-tight" numberOfLines={2}>
            {survey.title}
          </Text>
          {survey.description ? (
            <Text className="text-muted-foreground text-sm leading-relaxed mb-3">
              {survey.description}
            </Text>
          ) : null}
          {survey.location && (
            <View className="bg-secondary self-start px-3 py-1 rounded-full">
              <Text className="text-secondary-foreground text-xs font-bold">
                {survey.location}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
