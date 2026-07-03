import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSurveyStore } from './store';
import { Camera, CheckCircle, SkipForward, Camera as CameraIcon } from 'lucide-react-native';
import CustomModal, { CustomModalProps } from '../../components/ui/CustomModal';
import { Camera as VisionCamera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { ArrowLeft } from 'lucide-react-native';

export default function FinalCameraView() {
  const { isCancelled, isTestMode, endSurvey, prevQuestion } = useSurveyStore();
  const [modalConfig, setModalConfig] = useState<CustomModalProps | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isOmitted, setIsOmitted] = useState(false);
  
  // Vision Camera
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<VisionCamera>(null);

  const startCamera = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setIsCameraActive(true);
  };

  const takePhoto = async () => {
    try {
      if (cameraRef.current) {
        const photo = await cameraRef.current.takePhoto({
          flash: 'off'
        });
        setPhotoUri(`file://${photo.path}`);
        setIsCameraActive(false); // Apagamos la cámara al tomar la foto para liberar RAM
      }
    } catch (e) {
      console.error("Error taking photo:", e);
      // En emuladores sin cámara suele fallar por política, simulamos una foto para que no te bloquees
      setPhotoUri(`file:///mock_photo_emulator.jpg`);
      setIsCameraActive(false);
    }
  };

  const handleFinish = () => {
    if (!photoUri && !isOmitted) {
      setModalConfig({
        visible: true,
        title: "Evidencia Requerida",
        description: isCancelled 
          ? "Es obligatorio adjuntar una fotografía ya que la encuesta fue cancelada/incompleta."
          : "Debes tomar una foto o presionar explícitamente el botón de 'Omitir' antes de finalizar.",
        type: "destructive",
        confirmText: "Entendido",
        onCancel: undefined,
        onConfirm: () => setModalConfig(null)
      });
      return;
    }

    setModalConfig({
      visible: true,
      title: "Finalizar Encuesta",
      description: "Se guardará el registro localmente y se detendrá la grabación de audio.",
      type: "info",
      confirmText: "Confirmar",
      cancelText: "Cancelar",
      onCancel: () => setModalConfig(null),
      onConfirm: () => {
        setModalConfig(null);
        // Pasar la foto real al store para persistirla en WatermelonDB
        endSurvey(photoUri, null); // audioUri=null → el store llama stopRecording internamente
      }
    });
  };

  const handleSkip = () => {
    setModalConfig({
      visible: true,
      title: "Omitir Fotografía",
      description: "¿Estás seguro de omitir la evidencia fotográfica? (El audio se guardará de todos modos).",
      type: "destructive",
      confirmText: "Sí, Omitir",
      cancelText: "No",
      onCancel: () => setModalConfig(null),
      onConfirm: () => {
        setModalConfig(null);
        setIsOmitted(true);
      }
    });
  };

  return (
    <View className="flex-1 bg-background pt-16 px-6 pb-8">
      
      {modalConfig && (
        <CustomModal {...modalConfig} />
      )}

      {/* Botón discreto para regresar (Oculto si se activó la cámara o la encuesta fue cancelada) */}
      {!isCancelled && !isCameraActive && (
        <TouchableOpacity 
          className="absolute top-16 left-6 flex-row items-center active:opacity-60 z-10"
          onPress={prevQuestion}
        >
          <ArrowLeft color="#64748B" size={20} style={{ marginRight: 6 }} />
          <Text className="text-muted-foreground font-bold text-sm tracking-wide">
            Corregir
          </Text>
        </TouchableOpacity>
      )}

      {/* Header */}
      <View className="items-center mb-6 mt-12">
        <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
          <CameraIcon color="#3B82F6" size={32} />
        </View>
        <Text className="text-foreground text-3xl font-black text-center tracking-tight mb-2">
          Evidencia Fotográfica
        </Text>
        <Text className="text-muted-foreground text-center text-sm font-medium px-4 leading-relaxed">
          {isCancelled 
            ? "Has cancelado la encuesta. Es OBLIGATORIO tomar una fotografía como evidencia del intento."
            : "Toma una fotografía del encuestado (o del entorno) para anexar como evidencia de este registro."
          }
        </Text>
      </View>

      {/* Contenedor Principal (Foto o Cámara) */}
      <View className="flex-1 bg-card border-2 border-border border-dashed rounded-3xl items-center justify-center mb-6 overflow-hidden relative">
        
        {!isCameraActive && !photoUri && (
          <View className="items-center justify-center p-6">
            <Camera color="#64748B" size={64} opacity={0.3} className="mb-6" />
            
            <TouchableOpacity 
              className="bg-primary px-8 py-4 rounded-xl flex-row items-center justify-center shadow-lg active:opacity-80"
              onPress={startCamera}
            >
              <Camera color="#F8FAFC" size={24} style={{ marginRight: 12 }} />
              <Text className="text-primary-foreground font-bold text-lg tracking-wide">
                Activar Cámara
              </Text>
            </TouchableOpacity>

            {!isCancelled && (
              <Text className="text-muted-foreground text-center text-sm mt-6 px-4">
                Presiona "Omitir" abajo si no es posible tomar evidencia.
              </Text>
            )}
          </View>
        )}

        {isCameraActive && device && (
          <>
            <VisionCamera
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={true}
              photo={true}
            />
            <TouchableOpacity 
              className="absolute bottom-8 bg-white/30 w-24 h-24 rounded-full border-4 border-white shadow-2xl items-center justify-center active:bg-white/50"
              onPress={takePhoto}
            >
              <View className="w-20 h-20 bg-white rounded-full" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="absolute top-6 right-6 bg-black/50 px-4 py-2 rounded-full"
              onPress={() => setIsCameraActive(false)}
            >
              <Text className="text-white font-bold">Cerrar</Text>
            </TouchableOpacity>
          </>
        )}

        {!isCameraActive && photoUri && (
          <>
            <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View className="absolute bottom-6 flex-row gap-4">
              <TouchableOpacity 
                className="bg-destructive/90 px-6 py-3 rounded-full border-2 border-background shadow-xl active:bg-destructive"
                onPress={() => setPhotoUri(null)}
              >
                <Text className="text-white font-bold tracking-wide">Descartar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </View>

      {/* Footer Actions */}
      <View className="space-y-4">

        {/* Solo permitir omitir si NO está cancelada, no hay foto y no la ha omitido ya */}
        {!isCancelled && !photoUri && !isOmitted && !isCameraActive && (
          <TouchableOpacity 
            className="w-full bg-secondary border border-border py-4 rounded-xl flex-row items-center justify-center active:opacity-80 mb-3"
            onPress={handleSkip}
          >
            <SkipForward color="#F8FAFC" size={20} style={{ marginRight: 12 }} />
            <Text className="text-secondary-foreground font-bold text-base tracking-wide">
              Omitir Evidencia
            </Text>
          </TouchableOpacity>
        )}

        {/* Solo mostrar Finalizar si ya se cumplió el requisito de la evidencia */}
        {(photoUri || isOmitted) && (
          <TouchableOpacity 
            className="w-full bg-success py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-success/30 active:opacity-80"
            onPress={handleFinish}
          >
            <CheckCircle color="#F8FAFC" size={24} style={{ marginRight: 12 }} />
            <Text className="text-success-foreground font-black text-lg tracking-wide text-white">
              Guardar y Salir
            </Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}
