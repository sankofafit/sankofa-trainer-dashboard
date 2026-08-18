/* eslint-disable */
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function useUnreadMessages(trainer) {
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef(null);

  const loadUnreadCount = async () => {
    if (!trainer?.owner_id) return;

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', trainer.owner_id)
        .eq('is_read', false);

      if (error) {
        console.log('Unread count error:', error);
        return;
      }

      console.log('Unread messages:', count);
      setUnreadCount(count || 0);
    } catch (e) {
      console.log('loadUnreadCount error:', e);
    }
  };

  useEffect(() => {
    if (!trainer?.owner_id) return;

    loadUnreadCount();

    const channel = supabase
      .channel(`unread_${trainer.owner_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${trainer.owner_id}`,
        },
        () => {
          console.log('New message received!');
          setUnreadCount((prev) => prev + 1);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${trainer.owner_id}`,
        },
        () => {
          loadUnreadCount();
        },
      )
      .subscribe((status) => {
        console.log('Unread sub status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [trainer?.owner_id]);

  return { unreadCount, loadUnreadCount };
}
