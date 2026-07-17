const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const { promises: fs } = require('fs');
const path = require('path');

/**
 * Inyecta network_security_config.xml que permite tráfico HTTP sin cifrar
 * a cualquier destino. Necesario porque el servidor de producción usa HTTP.
 */
const withCleartextTraffic = (config) => {
  // 1. Escribir el archivo XML
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'res',
        'xml'
      );
      await fs.mkdir(resDir, { recursive: true });
      await fs.writeFile(
        path.join(resDir, 'network_security_config.xml'),
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
</network-security-config>`
      );
      return config;
    },
  ]);

  // 2. Referenciar el XML desde AndroidManifest.xml (en el tag <application>, no <manifest>)
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (manifest.application && manifest.application.$) {
      manifest.application.$['android:networkSecurityConfig'] =
        '@xml/network_security_config';
      manifest.application.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });

  return config;
};

module.exports = withCleartextTraffic;
