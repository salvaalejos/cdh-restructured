const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Inyecta tipos de Foreground Service para Android 14 (API 34)
 * en el AndroidManifest.xml para @notifee/react-native:
 * - microphone (para grabación de audio de auditoría continua)
 * - dataSync (para sincronización de subida en segundo plano)
 */
const withForegroundServices = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Asegurar namespace tools en el elemento raíz <manifest>
    if (!manifest.$) manifest.$ = {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application?.[0];
    if (application) {
      if (!application.service) {
        application.service = [];
      }

      // Buscar si Notifee ForegroundService ya está presente
      let notifeeService = application.service.find(
        (s) => s.$ && s.$['android:name'] === 'app.notifee.core.ForegroundService'
      );

      if (!notifeeService) {
        notifeeService = {
          $: {
            'android:name': 'app.notifee.core.ForegroundService',
          },
        };
        application.service.push(notifeeService);
      }

      // Inyectar android:foregroundServiceType y tools:replace
      notifeeService.$['android:foregroundServiceType'] = 'microphone|dataSync';
      notifeeService.$['tools:replace'] = 'android:foregroundServiceType';
    }

    return config;
  });
};

module.exports = withForegroundServices;
