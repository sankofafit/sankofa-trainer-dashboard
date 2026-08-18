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

export const showTrainerNotification = async (type, data = {}) => {
  if (Notification.permission !== 'granted') {
    await requestNotificationPermission();
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const notifications = {
    new_booking: {
      title: '🎉 New Booking!',
      body: `${data.clientName || 'A client'} booked ${
        data.sessionType || 'a session'
      } on ${data.date || ''}`,
      icon: '/favicon.png',
      url: '/bookings',
      tag: 'new-booking',
    },
    new_message: {
      title: '💬 New Message',
      body:
        data.content?.length > 60
          ? `${data.content.slice(0, 60)}...`
          : data.content || 'You have a new message',
      icon: '/favicon.png',
      url: '/chat',
      tag: 'new-message',
    },
    approved: {
      title: '✅ Profile Approved!',
      body: 'Congratulations! Your trainer profile has been approved. You are now live on Sankofa Fit!',
      icon: '/favicon.png',
      url: '/',
      tag: 'approved',
    },
    rejected: {
      title: '❌ Profile Not Approved',
      body: `Your profile was not approved${
        data.reason ? `: ${data.reason}` : ''
      }. Please update and resubmit.`,
      icon: '/favicon.png',
      url: '/profile',
      tag: 'rejected',
    },
    suspended: {
      title: '⚠️ Account Suspended',
      body: 'Your account has been suspended. Please contact Sankofa Fit support.',
      icon: '/favicon.png',
      url: '/',
      tag: 'suspended',
    },
    payout_sent: {
      title: '💰 Payout Sent!',
      body: `GHS ${data.amount || ''} has been sent to your MoMo account ${
        data.momoNumber || ''
      }`,
      icon: '/favicon.png',
      url: '/earnings',
      tag: 'payout',
    },
    booking_cancelled: {
      title: '❌ Booking Cancelled',
      body: `${data.clientName || 'A client'} cancelled their ${
        data.sessionType || 'session'
      } on ${data.date || ''}`,
      icon: '/favicon.png',
      url: '/bookings',
      tag: 'booking-cancelled',
    },
    new_review: {
      title: '⭐ New Review!',
      body: `${data.clientName || 'A client'} gave you ${
        data.rating || 5
      } stars: "${data.review || ''}"`,
      icon: '/favicon.png',
      url: '/',
      tag: 'new-review',
    },
    session_reminder: {
      title: '⏰ Session in 1 Hour!',
      body: `You have a session with ${
        data.clientName || 'a client'
      } at ${data.time || ''}`,
      icon: '/favicon.png',
      url: '/bookings',
      tag: 'session-reminder',
    },
  };

  const notif = notifications[type];
  if (!notif) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(notif.title, {
      body: notif.body,
      icon: notif.icon,
      badge: '/favicon.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: notif.tag,
      data: { url: notif.url },
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
        },
      ],
    });
  } catch (e) {
    new Notification(notif.title, {
      body: notif.body,
      icon: notif.icon,
    });
  }
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
