import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react-native';

export interface CustomModalProps {
  visible: boolean;
  title: string;
  description: string;
  type?: 'destructive' | 'info' | 'success';
  cancelText?: string;
  confirmText?: string;
  onCancel?: () => void;
  onConfirm: () => void;
}

export default function CustomModal({
  visible,
  title,
  description,
  type = 'info',
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  onCancel,
  onConfirm,
}: CustomModalProps) {
  
  const getIcon = () => {
    switch (type) {
      case 'destructive': return <AlertTriangle color="#EF4444" size={32} />;
      case 'success': return <CheckCircle2 color="#10B981" size={32} />;
      default: return <Info color="#3B82F6" size={32} />;
    }
  };

  const getConfirmStyle = () => {
    switch (type) {
      case 'destructive': return 'bg-destructive border-destructive shadow-destructive/30';
      case 'success': return 'bg-success border-success shadow-success/30';
      default: return 'bg-primary border-primary shadow-primary/30';
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        
        <View className="w-full bg-card rounded-3xl border border-border p-6 shadow-2xl relative overflow-hidden">
          
          {/* Top Decorative Line */}
          <View className={`absolute top-0 left-0 right-0 h-1.5 ${type === 'destructive' ? 'bg-destructive' : type === 'success' ? 'bg-success' : 'bg-primary'}`} />

          {/* Close Button (if cancel is provided) */}
          {onCancel && (
            <Pressable 
              className="absolute top-4 right-4 p-2 bg-secondary rounded-full"
              onPress={onCancel}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <X color="#64748B" size={18} />
            </Pressable>
          )}

          {/* Content */}
          <View className="items-center mb-6 mt-2">
            <View className={`w-16 h-16 rounded-full items-center justify-center mb-4 ${type === 'destructive' ? 'bg-destructive/10' : type === 'success' ? 'bg-success/10' : 'bg-primary/10'}`}>
              {getIcon()}
            </View>
            <Text className="text-foreground text-2xl font-black text-center mb-2 tracking-tight">
              {title}
            </Text>
            <Text className="text-muted-foreground text-center text-sm leading-relaxed px-2">
              {description}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row w-full mt-4 gap-4">
            {onCancel && (
              <Pressable 
                className="flex-1 bg-transparent py-3.5 rounded-xl border border-border items-center justify-center active:bg-secondary"
                onPress={onCancel}
              >
                <Text className="text-muted-foreground font-bold tracking-wide">
                  {cancelText}
                </Text>
              </Pressable>
            )}
            
            <Pressable 
              className={`flex-1 py-3.5 rounded-xl border items-center justify-center shadow-lg ${getConfirmStyle()}`}
              onPress={onConfirm}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
            >
              <Text className="text-white font-bold tracking-wide">
                {confirmText}
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}
