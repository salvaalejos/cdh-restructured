import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  value,
  max,
  label,
  color = '#3B82F6', // Shadcn Primary Blue
  size = 100,
  strokeWidth = 10
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  // Prevent division by zero
  const safeMax = max > 0 ? max : 1;
  const progress = Math.min(Math.max(value / safeMax, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View className="items-center justify-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            stroke="#1E293B" // border-border in Shadcn Dark
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            stroke={color}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        {/* Center Text */}
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-foreground text-xl font-bold">
            {value}
          </Text>
          <Text className="text-muted-foreground text-[10px] font-medium -mt-1 uppercase tracking-widest">
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}
