import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rosesfamily.eveningmilk',
  appName: 'Evening Milk',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_evening_milk',
      iconColor: '#0a7ec2',
    },
  },
};

export default config;
