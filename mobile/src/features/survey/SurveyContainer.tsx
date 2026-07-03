import React from 'react';
import { View, Text } from 'react-native';
import { useSurveyStore } from './store';
import QuestionView from './QuestionView';
import FinalCameraView from './FinalCameraView';

export default function SurveyContainer() {
  const { currentIndex, questions, isTestMode } = useSurveyStore();

  // Si el índice es igual a la longitud de las preguntas, significa que ya terminamos el cuestionario
  // y debemos pasar a la vista final de la cámara.
  const isFinished = currentIndex >= questions.length;

  return (
    <View className="flex-1 bg-background">
      {isTestMode && (
        <View className="bg-destructive px-4 py-1 pb-2 pt-12 items-center justify-center">
          <Text className="text-destructive-foreground font-black text-xs uppercase tracking-widest mt-2">
            Modo de Prueba (No se guardará)
          </Text>
        </View>
      )}

      {isFinished ? (
        <FinalCameraView />
      ) : (
        <QuestionView question={questions[currentIndex]} index={currentIndex} total={questions.length} />
      )}
    </View>
  );
}
