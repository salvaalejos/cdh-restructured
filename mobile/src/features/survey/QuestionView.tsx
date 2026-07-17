import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Image, Animated } from 'react-native';
import { useSurveyStore, Question, Option } from './store';
import { ArrowLeft, ArrowRight, ArrowDown, XCircle } from 'lucide-react-native';
import CustomModal from '../../components/ui/CustomModal';

interface QuestionViewProps {
  question: Question;
  index: number;
  total: number;
}

export default function QuestionView({ question, index, total }: QuestionViewProps) {
  const { setAnswer, answers, nextQuestion, prevQuestion, cancelSurvey } = useSurveyStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  const currentAnswer = answers[question.id];

  useEffect(() => {
    if (showScrollArrow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(arrowAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      arrowAnim.stopAnimation();
      arrowAnim.setValue(0);
    }
  }, [showScrollArrow, arrowAnim]);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    setShowScrollArrow(distanceFromBottom > 20);
  };

  const handleContentSizeChange = (contentWidth: number, contentHeight: number) => {
    scrollRef.current?.measure((_x, _y, _width, height) => {
      setShowScrollArrow(contentHeight > height + 20);
    });
  };

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
        description="¿Estás seguro que deseas cancelar esta encuesta? Se detendrá la grabación de audio y perderás todo el progreso de esta encuesta."
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

      {/* Question Text — fixed outside scroll */}
      <Text className="text-foreground text-3xl font-black mb-6 leading-tight">
        {question.text}
      </Text>

      {/* Scrollable content area */}
      <View className="flex-1">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
        >
          {/* Type 1: Open text */}
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

          {/* Type 2/3: Single or multiple choice */}
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
                        if (question.typeId === 2) {
                          setAnswer(question.id, opt.id);
                        } else {
                          const curr = Array.isArray(currentAnswer) ? currentAnswer : [];
                          if (curr.includes(opt.id)) {
                            setAnswer(question.id, curr.filter((id: string) => id !== opt.id));
                          } else {
                            setAnswer(question.id, [...curr, opt.id]);
                          }
                        }
                      } catch (error) {
                        console.error('Error selecting option:', error);
                      }
                    }}
                    className="border-2 rounded-2xl mb-4 overflow-hidden shadow-sm w-full"
                    style={{
                      backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : '#020817',
                      borderColor: isSelected ? '#3B82F6' : '#1E293B'
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
                        style={{ color: isSelected ? '#3B82F6' : '#F8FAFC' }}
                      >
                        {opt.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Type 4/5: Matrix — vertical cards */}
          {[4, 5].includes(question.typeId) && question.options && question.subOptions && (
            <View>
              {question.options.map((opt) => {
                const hasImage = !!opt.image;
                const currentOptAnswer = currentAnswer?.[opt.id];
                const hasSelection = question.typeId === 4
                  ? !!currentOptAnswer
                  : (Array.isArray(currentOptAnswer) && currentOptAnswer.length > 0);

                return (
                  <View
                    key={opt.id}
                    className="border-2 rounded-2xl mb-4 overflow-hidden"
                    style={{
                      backgroundColor: hasSelection ? 'rgba(59, 130, 246, 0.05)' : '#020817',
                      borderColor: hasSelection ? '#3B82F6' : '#1E293B'
                    }}
                  >
                    {/* Option text */}
                    <View className="px-5 pt-4 pb-3">
                      <Text className="text-foreground text-lg font-bold leading-tight" style={{ color: '#F8FAFC' }}>
                        {opt.text}
                      </Text>
                    </View>

                    {/* Option image — between text and sub-options */}
                    {hasImage && (
                      <View className="px-5 pb-3">
                        <Image
                          source={{ uri: opt.image }}
                          className="w-full h-40 rounded-xl bg-secondary"
                          resizeMode="contain"
                        />
                      </View>
                    )}

                    {/* Sub-options — vertical list */}
                    <View className="px-5 pb-4">
                      {question.subOptions!.map((subOpt) => {
                        const isSubSelected = question.typeId === 4
                          ? currentOptAnswer === subOpt.id
                          : (Array.isArray(currentOptAnswer) && currentOptAnswer.includes(subOpt.id));

                        return (
                          <TouchableOpacity
                            key={subOpt.id}
                            activeOpacity={0.7}
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
                            className="flex-row items-center py-3 border-b border-border"
                            style={{ borderBottomWidth: 1 }}
                          >
                            <View
                              className={`w-6 h-6 border-2 items-center justify-center mr-4 ${question.typeId === 5 ? 'rounded-md' : 'rounded-full'}`}
                              style={{
                                borderColor: isSubSelected ? '#3B82F6' : '#64748B',
                                backgroundColor: isSubSelected ? '#3B82F6' : 'transparent'
                              }}
                            >
                              {isSubSelected && (
                                <View className={`${question.typeId === 5 ? 'w-3.5 h-3.5 bg-white rounded-sm' : 'w-3 h-3 bg-white rounded-full'}`} />
                              )}
                            </View>
                            <Text
                              className="text-base flex-1"
                              style={{ color: isSubSelected ? '#3B82F6' : '#F8FAFC' }}
                            >
                              {subOpt.text}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View className="h-4" />
        </ScrollView>

        {/* Animated down arrow — shows when content overflows */}
        {showScrollArrow && (
          <Animated.View
            className="absolute bottom-2 left-0 right-0 items-center"
            style={{
              opacity: arrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
              transform: [{
                translateY: arrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] })
              }]
            }}
          >
            <View className="bg-card/90 border border-border rounded-full px-4 py-2 shadow-lg" style={{ elevation: 6 }}>
              <ArrowDown color="#3B82F6" size={20} />
            </View>
          </Animated.View>
        )}
      </View>

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
            backgroundColor: isNextDisabled ? '#F1F5F9' : '#3B82F6',
            borderColor: isNextDisabled ? 'rgba(100, 116, 139, 0.3)' : '#3B82F6',
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
