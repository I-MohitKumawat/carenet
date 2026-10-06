import React from 'react';
import { View } from 'react-native';

interface ProgressBarProps {
  totalSteps?: number;
  currentStep: number; // 1-indexed
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  totalSteps = 3,
  currentStep,
  className = '',
}) => {
  return (
    <View className={`flex-row items-center justify-center gap-[7px] ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index < currentStep;
        return (
          <View
            key={index}
            className={`w-[38px] h-[4px] rounded-[2px] ${
              isActive ? 'bg-brand-primary' : 'bg-[#EBEFF5]'
            }`}
          />
        );
      })}
    </View>
  );
};
