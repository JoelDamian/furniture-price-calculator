import { registerSW } from 'virtual:pwa-register';

export const registerAppUpdates = (): void => {
  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const checkForUpdates = () => {
        registration.update().catch(() => {
          // Ignore network errors during background update checks.
        });
      };

      checkForUpdates();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          checkForUpdates();
        }
      });
    },
  });
};
