import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.woofyapp',
  appName: 'woofyapp',
  webDir: 'dist',
  server: {
    url: 'https://woofyapp.lovable.app?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
