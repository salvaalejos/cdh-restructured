import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image } from 'react-native';
import { useSurveyStore, Question, Option } from './store';
import { ArrowLeft, ArrowRight, XCircle } from 'lucide-react-native';
import CustomModal from '../../components/ui/CustomModal';

interface QuestionViewProps {
  question: Question;
  index: number;
  total: number;
}

export default function QuestionView({ question, index, total }: QuestionViewProps) {
  const { setAnswer, answers, nextQuestion, prevQuestion, cancelSurvey } = useSurveyStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  const currentAnswer = answers[question.id];

  const handleNext = () => {
    nextQuestion();
  };

  const handleCancel = () => {
    setModalVisible(true);
  };

  const confirmCancel = () => {
    setModalVisible(false);
    cancelSurvey();
  };

  let isNextDisabled = false;
  if (!currentAnswer && currentAnswer !== '') {
    isNextDisabled = true;
  } else if ([2, 3].includes(question.typeId)) {
    isNextDisabled = currentAnswer === '' || (Array.isArray(currentAnswer) && currentAnswer.length === 0);
  } else if ([4, 5].includes(question.typeId) && question.options) {
    for (const opt of question.options) {
      const optAns = currentAnswer[opt.id];
      if (!optAns || (Array.isArray(optAns) && optAns.length === 0)) {
        isNextDisabled = true;
        break;
      }
    }
  }

  return (
    <View className="flex-1 bg-background pt-12 pb-6 px-6">
      
      <CustomModal 
        visible={modalVisible}
        title="Cancelar Encuesta"
        description="¿Estás seguro que deseas cancelar esta encuesta? Se marcará como incompleta y pasarás directamente a tomar la fotografía de evidencia."
        type="destructive"
        confirmText="Sí, Cancelar"
        cancelText="No, continuar"
        onCancel={() => setModalVisible(false)}
        onConfirm={confirmCancel}
      />

      {/* Header */}
      <View className="flex-row items-center justify-between mb-8">
        <Text className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          Pregunta {index + 1} de {total}
        </Text>
        <View className="bg-primary/20 px-3 py-1 rounded-full">
          <Text className="text-primary font-bold text-xs">{Math.round(((index + 1) / total) * 100)}%</Text>
        </View>
      </View>

      {/* Question Text */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Text className="text-foreground text-3xl font-black mb-8 leading-tight">
          {question.text}
        </Text>

        {/* Dynamic Options Render based on TypeId */}
        {question.typeId === 1 && (
          <View className="bg-card border border-input rounded-xl p-2">
            <TextInput
              className="text-foreground text-lg p-4 min-h-[150px]"
              placeholder="Escribe la respuesta aquí..."
              placeholderTextColor="#64748B"
              multiline
              textAlignVertical="top"
              value={currentAnswer || ''}
              onChangeText={(text) => setAnswer(question.id, text)}
            />
          </View>
        )}

        {[2, 3].includes(question.typeId) && question.options && (
          <View className="space-y-4">
            {question.options.map((opt: Option) => {
              const isSelected = question.typeId === 2 
                ? currentAnswer === opt.id 
                : (Array.isArray(currentAnswer) && currentAnswer.includes(opt.id));
              
              const hasImage = !!opt.image;

              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    try {
                      console.log('Selecting option:', opt.id, 'for question:', question.id);
                      if (question.typeId === 2) {
                        console.log('Setting single choice answer');
                        setAnswer(question.id, opt.id);
                      } else {
                        console.log('Setting multiple choice answer');
                        const curr = Array.isArray(currentAnswer) ? currentAnswer : [];
                        if (curr.includes(opt.id)) {
                          setAnswer(question.id, curr.filter((id: string) => id !== opt.id));
                        } else {
                          setAnswer(question.id, [...curr, opt.id]);
                        }
                      }
                      console.log('Successfully set answer');
                    } catch (error) {
                      console.error('Error selecting option:', error);
                    }
                  }}
                  className="border-2 rounded-2xl mb-4 overflow-hidden shadow-sm w-full"
                  style={{
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#FFFFFF',
                    borderColor: isSelected ? '#3B82F6' : '#E2E8F0'
                  }}
                >
                  {hasImage && (
                    <Image 
                      source={{ uri: opt.image }} 
                      className="w-full h-48 bg-secondary rounded-t-xl"
                      resizeMode="contain" 
                    />
                  )}
                  
                  <View className="p-4 flex-row items-center">
                    <View 
                      className={`w-5 h-5 border-2 mr-3 items-center justify-center ${question.typeId === 3 ? 'rounded-md' : 'rounded-full'}`}
                      style={{
                        borderColor: isSelected ? '#3B82F6' : '#64748B',
                        backgroundColor: isSelected ? '#3B82F6' : 'transparent'
                      }}
                    >
                      {isSelected && <View className="w-2.5 h-2.5 bg-background rounded-full" />}
                    </View>
                    <Text 
                      className="text-lg font-bold flex-1"
                      style={{ color: isSelected ? '#3B82F6' : '#1E293B' }}
                    >
                      {opt.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {[4, 5].includes(question.typeId) && question.options && question.subOptions && (
          <View className="bg-card border border-border rounded-2xl overflow-hidden">
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                {/* Header Row */}
                <View className="flex-row bg-secondary/50 border-b border-border">
                  <View className="w-28 p-3 justify-center">
                    <Text className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Ítem</Text>
                  </View>
                  {question.subOptions.map((subOpt) => (
                    <View key={subOpt.id} className="w-28 items-center justify-center p-2 border-l border-border">
                      <Text
                        className="text-foreground text-xs font-bold text-center leading-tight"
                        numberOfLines={2}
                      >
                        {subOpt.text}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Data Rows */}
                {question.options.map((opt, oi) => {
                  const hasImage = !!opt.image;
                  const currentOptAnswer = currentAnswer?.[opt.id];
                  return (
                    <View
                      key={opt.id}
                      className={`flex-row items-stretch ${oi < question.options!.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <View className="w-28 p-3 justify-center">
                        {hasImage && (
                          <Image
                            source={{ uri: opt.image }}
                            className="w-full h-14 rounded-lg mb-1 bg-secondary"
                            resizeMode="contain"
                          />
                        )}
                        <Text className="text-foreground text-sm font-bold leading-tight" numberOfLines={3}>
                          {opt.text}
                        </Text>
                      </View>
                      {question.subOptions!.map((subOpt) => {
                        const isSelected = question.typeId === 4
                          ? currentOptAnswer === subOpt.id
                          : (Array.isArray(currentOptAnswer) && currentOptAnswer.includes(subOpt.id));

                        return (
                          <TouchableOpacity
                            key={subOpt.id}
                            className="w-28 items-center justify-center p-3 border-l border-border"
                            style={{
                              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                            }}
                            onPress={() => {
                              if (question.typeId === 4) {
                                const newState = { ...(currentAnswer || {}), [opt.id]: subOpt.id };
                                setAnswer(question.id, newState);
                              } else {
                                const curr = Array.isArray(currentOptAnswer) ? currentOptAnswer : [];
                                const newSub = curr.includes(subOpt.id)
                                  ? curr.filter((i) => i !== subOpt.id)
                                  : [...curr, subOpt.id];
                                const newState = { ...(currentAnswer || {}), [opt.id]: newSub };
                                setAnswer(question.id, newState);
                              }
                            }}
                          >
                            <View
                              className={`w-6 h-6 border-2 items-center justify-center ${question.typeId === 5 ? 'rounded-md' : 'rounded-full'}`}
                              style={{
                                borderColor: isSelected ? '#3B82F6' : '#64748B',
                                backgroundColor: isSelected ? '#3B82F6' : 'transparent'
                              }}
                            >
                              {isSelected && (
                                <View className={`${question.typeId === 5 ? 'w-3.5 h-3.5 bg-white rounded-sm' : 'w-3 h-3 bg-white rounded-full'}`} />
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
        <View className="h-10" />
      </ScrollView>

      {/* Footer Navigation */}
      <View className="flex-row items-center justify-between pt-4 border-t border-border">
        {index > 0 ? (
          <TouchableOpacity 
            className="w-14 h-14 bg-secondary rounded-xl items-center justify-center active:opacity-80 border border-border"
            onPress={prevQuestion}
          >
            <ArrowLeft color="#F8FAFC" size={24} />
          </TouchableOpacity>
        ) : (
          <View className="w-14 h-14" /> // Spacer
        )}

        <TouchableOpacity 
          className="flex-1 mx-4 bg-destructive/10 border border-destructive py-4 rounded-xl flex-row items-center justify-center active:bg-destructive/20"
          onPress={handleCancel}
        >
          <XCircle color="#EF4444" size={20} style={{ marginRight: 12 }} />
          <Text className="text-destructive font-bold text-base tracking-wide">Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="w-14 h-14 rounded-xl items-center justify-center border"
          style={{
            backgroundColor: isNextDisabled ? '#F1F5F9' : '#3B82F6', // bg-muted : bg-primary
            borderColor: isNextDisabled ? 'rgba(100, 116, 139, 0.3)' : '#3B82F6', // border-muted-foreground/30 : border-primary
            opacity: isNextDisabled ? 0.5 : 1,
            shadowColor: isNextDisabled ? 'transparent' : '#3B82F6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isNextDisabled ? 0 : 0.3,
            shadowRadius: 10,
            elevation: isNextDisabled ? 0 : 5
          }}
          onPress={handleNext}
          disabled={isNextDisabled}
        >
          <ArrowRight color={isNextDisabled ? "#64748B" : "#F8FAFC"} size={24} strokeWidth={isNextDisabled ? 2 : 3} />
        </TouchableOpacity>
      </View>

    </View>
  );
}
