import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.heatwatch.pune',
  appName: 'HeatWatch',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
