import { supabase } from '../lib/supabase';

export const sendTrainerNotification = async (trainerId, type, data = {}) => {
  const templates = {
    new_booking: {
      title: '🎉 New Booking!',
      body: `${data.clientName || 'A client'} booked ${
        data.sessionType || 'a session'
      } on ${data.date || ''}`,
      url: '/bookings',
    },
    new_message: {
      title: '💬 New Message',
      body: `${data.clientName || 'A client'}: ${data.content?.slice(0, 60) || ''}`,
      url: '/chat',
    },
    approved: {
      title: '✅ Profile Approved!',
      body: 'Your trainer profile is now live on Sankofa Fit!',
      url: '/',
    },
    rejected: {
      title: '❌ Profile Not Approved',
      body: `Reason: ${data.reason || 'Please update your profile'}`,
      url: '/profile',
    },
    suspended: {
      title: '⚠️ Account Suspended',
      body: 'Your account has been suspended. Contact support.',
      url: '/',
    },
    payout_sent: {
      title: '💰 Payout Sent!',
      body: `GHS ${data.amount} sent to your MoMo account`,
      url: '/earnings',
    },
    booking_cancelled: {
      title: '❌ Booking Cancelled',
      body: `${data.clientName || 'A client'} cancelled their session on ${data.date}`,
      url: '/bookings',
    },
    new_review: {
      title: '⭐ New Review!',
      body: `${data.clientName} gave you ${data.rating} stars`,
      url: '/',
    },
  };

  const template = templates[type];
  if (!template) return;

  try {
    await supabase.from('trainer_notifications').insert({
      trainer_id: trainerId,
      type,
      title: template.title,
      body: template.body,
      url: template.url,
      metadata: data,
      is_read: false,
    });

    console.log('Notification sent:', type);
  } catch (e) {
    console.log('sendTrainerNotification:', e);
  }
};
