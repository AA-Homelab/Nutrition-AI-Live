import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutritrack.ai',
  appName: 'NutriTrack AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
