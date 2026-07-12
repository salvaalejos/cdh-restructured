import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Trash2, AlertTriangle, X } from 'lucide-react-native';

interface DeleteProgressButtonProps {
  onDelete: () => void;
}

export default function DeleteProgressButton({ onDelete }: DeleteProgressButtonProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
  };

  const handleConfirmDelete = async () => {
    handleCloseModal();
    await onDelete();
  };

  return (
    <>
      <TouchableOpacity
        className="w-full bg-transparent py-4 rounded-2xl items-center justify-center flex-row border border-destructive/30 active:bg-destructive/10 mt-4"
        onPress={() => { setDeleteConfirmText(''); setShowDeleteModal(true); }}
      >
        <Trash2 color="#EF4444" size={18} style={{ marginRight: 12 }} />
        <Text className="text-destructive font-bold text-sm tracking-wide">Borrar progreso</Text>
      </TouchableOpacity>

      <Modal transparent visible={showDeleteModal} animationType="fade" onRequestClose={handleCloseModal}>
        <View className="flex-1 bg-black/70 justify-center items-center px-6">
          <View className="w-full bg-card rounded-3xl border border-border p-6 shadow-2xl relative overflow-hidden">
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-destructive" />
            <TouchableOpacity
              className="absolute top-4 right-4 p-2 bg-secondary rounded-full active:opacity-80"
              onPress={handleCloseModal}
            >
              <X color="#64748B" size={18} />
            </TouchableOpacity>
            <View className="items-center mb-6 mt-2">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-destructive/10">
                <AlertTriangle color="#EF4444" size={32} />
              </View>
              <Text className="text-foreground text-2xl font-black text-center mb-2 tracking-tight">
                Borrar todo el progreso
              </Text>
              <Text className="text-muted-foreground text-center text-sm leading-relaxed px-2">
                Esta acción eliminará toda la base de datos local y archivos multimedia, incluyendo encuestas completadas y progreso. Para confirmar, escribe "confirmar".
              </Text>
            </View>
            <TextInput
              className="bg-secondary text-foreground border border-border rounded-xl px-4 py-3.5 mb-6 text-base font-medium"
              placeholder='Escribe "confirmar"'
              placeholderTextColor="#64748B"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row w-full gap-4">
              <TouchableOpacity
                className="flex-1 bg-transparent py-3.5 rounded-xl border border-border items-center justify-center active:bg-secondary"
                onPress={handleCloseModal}
              >
                <Text className="text-muted-foreground font-bold tracking-wide">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3.5 rounded-xl border items-center justify-center shadow-lg ${
                  deleteConfirmText === 'confirmar'
                    ? 'bg-destructive border-destructive shadow-destructive/30'
                    : 'bg-destructive/50 border-destructive/50'
                }`}
                onPress={handleConfirmDelete}
                disabled={deleteConfirmText !== 'confirmar'}
              >
                <Text className="text-white font-bold tracking-wide">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
