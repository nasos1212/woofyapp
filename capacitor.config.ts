import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.wooffy',
  appName: 'Wooffy',
  webDir: 'dist',
  backgroundColor: '#1A1A2E',
  ios: {
    contentInset: 'always',
    backgroundColor: '#1A1A2E',
    limitsNavigationsToAppBoundScrollViews: false,
  },
  android: {
    backgroundColor: '#1A1A2E',
  },
  // For development hot-reload, uncomment this:
  // server: {
  //   url: 'https://wooffy.app?forceHideBadge=true',
  //   cleartext: true
  // }
};

export default config;
