import { useState, useEffect, useCallback } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'react-native-vision-camera';
import notifee from '@notifee/react-native';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionsState {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  location: PermissionStatus;
  notifications: PermissionStatus;
  allGranted: boolean;
}

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    camera: 'undetermined',
    microphone: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
    allGranted: false,
  });
  
  const [isChecking, setIsChecking] = useState(true);

  const checkPermissions = useCallback(async () => {
    setIsChecking(true);
    try {
      // 1. Verificar Cámara
      let cameraStatus: PermissionStatus = 'undetermined';
      if (Platform.OS === 'android') {
        const checkCam = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        cameraStatus = checkCam ? 'granted' : 'denied';
      }
      
      // 2. Verificar Micrófono
      let micStatus: PermissionStatus = 'undetermined';
      if (Platform.OS === 'android') {
        const checkMic = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        micStatus = checkMic ? 'granted' : 'denied';
      }
      
      // 3. Verificar Ubicación
      const { status: locStatus } = await Location.getForegroundPermissionsAsync();
      
      // 4. Verificar Notificaciones (Notifee)
      const settings = await notifee.getNotificationSettings();
      const notifStatus = settings.authorizationStatus > 0 ? 'granted' : 'denied';

      const newState: PermissionsState = {
        camera: cameraStatus,
        microphone: micStatus,
        location: locStatus === 'granted' ? 'granted' : 'denied',
        notifications: notifStatus,
        allGranted: cameraStatus === 'granted' && micStatus === 'granted' && locStatus === 'granted' && notifStatus === 'granted'
      };

      setPermissions(newState);
      return newState.allGranted;
    } catch (error) {
      console.error("Error al verificar permisos:", error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const requestAllPermissions = async () => {
    try {
      // Pedir Notificaciones primero
      await notifee.requestPermission();
      
      if (Platform.OS === 'android') {
        // Pedir Cámara
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        // Pedir Micrófono
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
      }
      
      // Pedir Ubicación
      await Location.requestForegroundPermissionsAsync();

      // Re-verificar después de solicitar
      await checkPermissions();
    } catch (error) {
      console.error("Error al solicitar permisos:", error);
      await checkPermissions(); // Refrescar estado incluso si hubo error
    }
  };

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    permissions,
    isChecking,
    requestAllPermissions,
    checkPermissions
  };
};
