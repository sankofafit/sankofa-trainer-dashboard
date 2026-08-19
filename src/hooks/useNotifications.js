import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { showTrainerNotification } from '../utils/pwa';

export default function useNotifications(trainer) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!trainer?.id) return;

    loadNotifications();
    subscribeToNotifications();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [trainer?.id]);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from('trainer_notifications')
        .select('*')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (e) {
      console.log('Load notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`trainer_notifs_${trainer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trainer_notifications',
          filter: `trainer_id=eq.${trainer.id}`,
        },
        (payload) => {
          const notif = payload.new;
          console.log('New notification:', notif);

          setNotifications((prev) => [notif, ...prev]);
          setUnreadCount((prev) => prev + 1);

          showTrainerNotification(
            notif.type,
            JSON.parse(JSON.stringify(notif.metadata || {})),
          ).catch(() => {});
        },
      )
      .subscribe();

    channelRef.current = channel;
  };

  const markAllRead = async () => {
    try {
      await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .eq('trainer_id', trainer.id)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.log('Mark read error:', e);
    }
  };

  const markOneRead = async (id) => {
    try {
      await supabase
        .from('trainer_notifications')
        .update({ is_read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.log('Mark one read error:', e);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAllRead,
    markOneRead,
  };
}
