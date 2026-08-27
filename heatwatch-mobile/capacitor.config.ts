import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heatwatch.mobile',
  appName: 'HeatWatch Mobile',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
