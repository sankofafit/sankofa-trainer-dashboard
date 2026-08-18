export const registerSW = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      console.log('SW registered:', registration);
      return registration;
    } catch (e) {
      console.log('SW registration failed:', e);
      return null;
    }
  }
  return null;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showNotification = async (title, options = {}) => {
  const permission = await requestNotificationPermission();

  if (!permission) return;

  const registration = await navigator.serviceWorker.ready;

  registration.showNotification(title, {
    icon: '/favicon.png',
    badge: '/favicon.png',
    vibrate: [100, 50, 100],
    requireInteraction: true,
    ...options,
  });
};

export const isPWA = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

let deferredPrompt = null;

export const setupInstallPrompt = (onPromptAvailable) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('Install prompt available');
    onPromptAvailable && onPromptAvailable();
  });
};

export const installPWA = async () => {
  if (!deferredPrompt) return false;

  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return result.outcome === 'accepted';
};
