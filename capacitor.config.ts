import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sarahsbrain.app',
  appName: "Sarah's Brain",
  webDir: 'client/dist',
  server: {
    // In production, the app connects to the local home server
    // In dev, point to local Express server
    url: 'http://localhost:3001',
    cleartext: true
  },
  plugins: {
    Browser: {
      // Links open in system browser
    }
  },
  android: {
    allowMixedContent: true
  },
  ios: {
    allowsLinkPreview: false
  }
};

export default config;
