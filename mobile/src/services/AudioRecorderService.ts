/**
 * AudioRecorderService
 *
 * Grabación de audio de auditoría por encuesta.
 * Usa react-native-nitro-sound (JSI, sin JS Bridge) para .m4a / AAC.
 * Usa expo-file-system para gestión de directorios.
 * Usa @notifee/react-native para el Foreground Service (REQ-NF-02).
 */

import notifee, { AndroidImportance, AndroidColor } from '@notifee/react-native';
import Sound from 'react-native-nitro-sound';
import * as FileSystem from 'expo-file-system/legacy';

class AudioRecorderService {
  private channelId: string | null = null;
  private isRecording: boolean = false;
  private currentPath: string | null = null;

  async initChannel() {
    if (this.channelId) return this.channelId;
    this.channelId = await notifee.createChannel({
      id: 'audit_recording',
      name: 'Grabación de Auditoría',
      description: 'Notificación persistente mientras se graba el audio de la encuesta',
      importance: AndroidImportance.HIGH,
      badge: false,
    });
    return this.channelId;
  }

  /**
   * Inicia la grabación de audio y levanta el Foreground Service.
   * @param surveySessionId Identificador de la sesión (para el nombre del archivo).
   */
  async startRecording(surveySessionId: string): Promise<void> {
    if (this.isRecording) return;

    try {
      const channel = await this.initChannel();

      // Foreground Service: evita que Android 14 mate el proceso con mic activo
      await notifee.displayNotification({
        title: '🎙 Grabando sesión...',
        body: 'El micrófono está activo registrando la auditoría de la encuesta.',
        android: {
          channelId: channel,
          asForegroundService: true,
          color: AndroidColor.RED,
          colorized: true,
          ongoing: true,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
        },
      });

      // Crear directorio de destino
      const dir = `${FileSystem.documentDirectory}audios/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const rawPath = `${dir}audit_${surveySessionId}_${Date.now()}.m4a`;
      const nativePath = rawPath.replace('file://', '');
      this.currentPath = rawPath;

      // Iniciar grabación JSI — AAC 32kbps mono (eficiente en RAM, REQ-NF-03)
      await Sound.startRecorder(nativePath, {
        quality: 'low',
        channels: 1,
        sampleRate: 22050,
      });

      this.isRecording = true;
      console.log(`[AudioService] Grabación iniciada → ${rawPath}`);
    } catch (error) {
      console.error('[AudioService] Error al iniciar grabación:', error);
      await notifee.stopForegroundService().catch(() => {});
      this.isRecording = false;
      this.currentPath = null;
    }
  }

  /**
   * Detiene la grabación, cierra el Foreground Service y devuelve la ruta del .m4a.
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) return null;

    try {
      await Sound.stopRecorder();
      await notifee.stopForegroundService();

      this.isRecording = false;
      const finalPath = this.currentPath;
      this.currentPath = null;

      console.log('[AudioService] Grabación detenida →', finalPath);
      return finalPath;
    } catch (error) {
      console.error('[AudioService] Error al detener grabación:', error);
      await notifee.stopForegroundService().catch(() => {});
      this.isRecording = false;
      this.currentPath = null;
      return null;
    }
  }

  get recording_active() {
    return this.isRecording;
  }
}

export default new AudioRecorderService();
