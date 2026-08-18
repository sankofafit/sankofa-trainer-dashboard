/* eslint-disable */
import React, {
  useState, useEffect, useRef,
} from 'react';
import { supabase } from '../lib/supabase';
import {
  RiSendPlaneFill,
  RiUserHeartLine,
  RiSearchLine,
  RiCheckDoubleLine,
} from 'react-icons/ri';

export default function ChatPage({ trainer }) {
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] =
    useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unreadCounts, setUnreadCounts] =
    useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const channelRef = useRef(null);
  const loadedMessagesRef = useRef(new Set());
  const authUserIdRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      authUserIdRef.current = user?.id || null;
    });
  }, []);

  useEffect(() => {
    if (trainer?.id) loadClients();
  }, [trainer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    if (!activeClient || !trainer) return;

    console.log('Opening chat with:',
      activeClient.full_name
    );

    setMessages([]);
    loadedMessagesRef.current = new Set();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const trainerId = trainer?.owner_id || authUserIdRef.current;
    const clientId = activeClient?.id;

    if (!trainerId || !clientId) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${trainerId},` +
          `receiver_id.eq.${clientId}),` +
          `and(sender_id.eq.${clientId},` +
          `receiver_id.eq.${trainerId})`
        )
        .order('created_at', { ascending: true });

      if (error) {
        console.log('Fetch error:', error);
        return;
      }

      console.log('Fetched messages:', data?.length);

      loadedMessagesRef.current = new Set(
        (data || []).map(m => m.id)
      );

      setMessages(data || []);
      await markMessagesAsRead();
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_${trainerId}_${clientId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new;

          const relevant =
            (String(msg.sender_id) === String(trainerId) &&
             String(msg.receiver_id) === String(clientId)) ||
            (String(msg.sender_id) === String(clientId) &&
             String(msg.receiver_id) === String(trainerId));

          if (!relevant) return;

          if (loadedMessagesRef.current.has(msg.id)) {
            console.log('Already have:', msg.id);
            return;
          }

          console.log('NEW message:', msg.content);
          loadedMessagesRef.current.add(msg.id);

          setMessages(prev => [...prev, msg]);

          if (String(msg.sender_id) === String(clientId)) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe((status) => {
        console.log('Sub status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [activeClient?.id, trainer?.owner_id]);

  const getTrainerSenderId = () =>
    trainer?.owner_id || authUserIdRef.current;

  const loadClients = async () => {
    try {
      const { data: bookings } = await supabase
        .from('trainer_bookings')
        .select('user_id')
        .eq('trainer_id', trainer.id);

      const uniqueUserIds = [
        ...new Set(
          (bookings || [])
            .map(b => b.user_id)
            .filter(Boolean)
        ),
      ];

      if (uniqueUserIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email, phone_gh')
        .in('id', uniqueUserIds);

      setClients(users || []);
      await loadUnreadCounts(uniqueUserIds);
    } catch (e) {
      console.log('Load clients error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCounts = async (userIds) => {
    const receiverId = getTrainerSenderId();
    if (!receiverId) return;

    try {
      const { data } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', receiverId)
        .eq('is_read', false)
        .in('sender_id', userIds);

      const counts = {};
      (data || []).forEach(msg => {
        counts[msg.sender_id] =
          (counts[msg.sender_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    } catch (e) {
      console.log('Unread counts error:', e);
    }
  };

  const markMessagesAsRead = async () => {
    if (!activeClient || !trainer) return;
    try {
      const receiverId = trainer.owner_id || authUserIdRef.current;
      if (!receiverId) return;

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', activeClient.id)
        .eq('receiver_id', receiverId)
        .eq('is_read', false);

      if (error) {
        console.log('Mark read error:', error);
        return;
      }

      console.log('Messages marked as read');

      setUnreadCounts(prev => ({
        ...prev,
        [activeClient.id]: 0,
      }));

      if (clients.length > 0) {
        await loadUnreadCounts(clients.map(c => c.id));
      }
    } catch (e) {
      console.log('markAsRead error:', e);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeClient ||
        sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const senderId = trainer?.owner_id || authUserIdRef.current;
      if (!senderId || !activeClient?.id) return;

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: activeClient.id,
          trainer_id: trainer?.id,
          content: messageText,
          is_read: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.log('Send error:', error);
        setNewMessage(messageText);
      }
    } catch (e) {
      setNewMessage(messageText);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const filteredClients = clients.filter(c =>
    !search ||
    c.full_name?.toLowerCase()
      .includes(search.toLowerCase()) ||
    c.email?.toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalUnread = Object.values(unreadCounts)
    .reduce((sum, count) => sum + count, 0);

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 100px)',
      gap: 0,
      borderRadius: 20,
      overflow: 'hidden',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 300,
        backgroundColor: '#0D1B45',
        display: 'flex',
        flexDirection: 'column',
        borderRight:
          '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '20px 16px 12px',
          borderBottom:
            '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <h3 style={{
              color: 'var(--text-primary)', fontSize: 16,
              fontWeight: 800, margin: 0,
            }}>
              Messages
            </h3>
            {totalUnread > 0 && (
              <div style={{
                backgroundColor: '#8B5CF6',
                borderRadius: 10,
                minWidth: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}>
                <span style={{
                  color: 'var(--text-primary)',
                  fontSize: 11, fontWeight: 900,
                }}>
                  {totalUnread}
                </span>
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor:
              'rgba(255,255,255,0.05)',
            border:
              '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '8px 12px',
          }}>
            <RiSearchLine
              size={14} color="#6B7B99"
            />
            <input
              value={search}
              onChange={e =>
                setSearch(e.target.value)
              }
              placeholder="Search clients..."
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                flex: 1,
                width: '100%',
              }}
            />
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto',
        }}>
          {loading ? (
            <p style={{
              color: 'var(--text-secondary)',
              padding: '20px 16px',
              fontSize: 13,
            }}>
              Loading clients...
            </p>
          ) : filteredClients.length === 0 ? (
            <div style={{
              padding: 24,
              textAlign: 'center',
            }}>
              <RiUserHeartLine
                size={36}
                color="rgba(139,92,246,0.3)"
                style={{ marginBottom: 8 }}
              />
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                No clients yet.{'\n'}
                Clients who book sessions
                with you appear here.
              </p>
            </div>
          ) : (
            filteredClients.map(client => {
              const unread =
                unreadCounts[client.id] || 0;
              const isActive =
                activeClient?.id === client.id;

              return (
                <div
                  key={client.id}
                  onClick={() => {
                    setActiveClient(client);
                  }}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    backgroundColor: isActive
                      ? 'rgba(139,92,246,0.15)'
                      : 'transparent',
                    borderLeft: isActive
                      ? '3px solid #8B5CF6'
                      : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style
                        .backgroundColor =
                        'rgba(255,255,255,0.03)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style
                        .backgroundColor =
                        'transparent';
                    }
                  }}
                >
                  <div style={{
                    width: 42, height: 42,
                    borderRadius: 21,
                    backgroundColor:
                      'rgba(139,92,246,0.15)',
                    border: `1px solid ${isActive
                      ? 'rgba(139,92,246,0.5)'
                      : 'rgba(139,92,246,0.2)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    position: 'relative',
                  }}>
                    <span style={{
                      color: '#8B5CF6',
                      fontSize: 16,
                      fontWeight: 800,
                    }}>
                      {client.full_name
                        ?.charAt(0)
                        ?.toUpperCase() || '?'
                      }
                    </span>
                    {unread > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: -3, right: -3,
                        width: 16, height: 16,
                        borderRadius: 8,
                        backgroundColor: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border:
                          '2px solid #0D1B45',
                      }}>
                        <span style={{
                          color: 'var(--text-primary)',
                          fontSize: 9,
                          fontWeight: 900,
                        }}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{
                    flex: 1, minWidth: 0,
                  }}>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      fontWeight: unread > 0
                        ? 800 : 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {client.full_name}
                    </div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                    }}>
                      {client.email}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        backgroundColor: 'var(--bg-main)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {!activeClient ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{
              width: 80, height: 80,
              borderRadius: 40,
              backgroundColor:
                'rgba(139,92,246,0.1)',
              border:
                '1px solid rgba(139,92,246,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RiUserHeartLine
                size={36}
                color="rgba(139,92,246,0.5)"
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                color: 'var(--text-primary)',
                fontSize: 16, fontWeight: 700,
                marginBottom: 6,
              }}>
                Select a client
              </p>
              <p style={{
                color: 'var(--text-secondary)', fontSize: 13,
              }}>
                Choose a client from the list
                to start chatting
              </p>
            </div>
          </div>
        ) : (
          <>
            <div style={{
              padding: '14px 20px',
              borderBottom:
                '1px solid rgba(255,255,255,0.06)',
              backgroundColor: '#0D1B45',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 40, height: 40,
                borderRadius: 20,
                backgroundColor:
                  'rgba(139,92,246,0.15)',
                border:
                  '1px solid rgba(139,92,246,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  color: '#8B5CF6',
                  fontSize: 16, fontWeight: 800,
                }}>
                  {activeClient.full_name
                    ?.charAt(0)?.toUpperCase()
                  }
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  color: 'var(--text-primary)',
                  fontSize: 15, fontWeight: 800,
                }}>
                  {activeClient.full_name}
                </div>
                <div style={{
                  color: '#30D158',
                  fontSize: 11, fontWeight: 600,
                }}>
                  ● Your Client
                </div>
              </div>
              {activeClient.phone_gh && (
                <a
                  href={`tel:${activeClient.phone_gh}`}
                  style={{
                    backgroundColor:
                      'rgba(48,209,88,0.1)',
                    border:
                      '1px solid rgba(48,209,88,0.2)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: '#30D158',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  📞 Call
                </a>
              )}
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              {messages.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 40,
                }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    textAlign: 'center',
                    lineHeight: 1.6,
                  }}>
                    No messages yet with{' '}
                    {activeClient.full_name}.{'\n'}
                    Send a message to get started!
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isTrainer =
                    String(msg.sender_id) ===
                    String(trainer?.owner_id || authUserIdRef.current);

                  console.log(
                    'Message from:',
                    isTrainer ? 'TRAINER' : 'CLIENT',
                    msg.content
                  );

                  return (
                    <div key={msg.id || i} style={{
                      display: 'flex',
                      justifyContent: isTrainer
                        ? 'flex-end'
                        : 'flex-start',
                      marginBottom: 8,
                    }}>
                      {!isTrainer && (
                        <div style={{
                          width: 28, height: 28,
                          borderRadius: 14,
                          backgroundColor:
                            'rgba(139,92,246,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#8B5CF6',
                          marginRight: 6,
                          alignSelf: 'flex-end',
                        }}>
                          {activeClient?.full_name
                            ?.charAt(0)?.toUpperCase()
                          }
                        </div>
                      )}

                      <div style={{ maxWidth: '65%' }}>
                        <div style={{
                          backgroundColor: isTrainer
                            ? '#8B5CF6'
                            : 'rgba(27,47,107,0.7)',
                          borderRadius: isTrainer
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                          padding: '10px 14px',
                          border: isTrainer
                            ? 'none'
                            : '1px solid rgba(255,255,255,0.06)',
                        }}>
                          <p style={{
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            margin: 0,
                            lineHeight: 1.5,
                            wordBreak: 'break-word',
                          }}>
                            {msg.content}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: isTrainer
                            ? 'flex-end' : 'flex-start',
                          marginTop: 3,
                          gap: 4,
                          alignItems: 'center',
                        }}>
                          <span style={{
                            color: 'var(--text-secondary)',
                            fontSize: 10,
                          }}>
                            {new Date(msg.created_at)
                              .toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                          </span>
                          {isTrainer && (
                            <RiCheckDoubleLine
                              size={12}
                              color={msg.is_read
                                ? '#8B5CF6' : '#6B7B99'
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{
              padding: '12px 16px',
              borderTop:
                '1px solid rgba(255,255,255,0.06)',
              backgroundColor: '#0D1B45',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-end',
            }}>
              <input
                ref={inputRef}
                value={newMessage}
                onChange={e =>
                  setNewMessage(e.target.value)
                }
                onKeyDown={e => {
                  if (e.key === 'Enter' &&
                      !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message ${activeClient.full_name}...`}
                style={{
                  flex: 1,
                  backgroundColor:
                    'rgba(255,255,255,0.05)',
                  border:
                    '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 24,
                  padding: '12px 18px',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => {
                  e.target.style.borderColor =
                    'rgba(139,92,246,0.5)';
                }}
                onBlur={e => {
                  e.target.style.borderColor =
                    'rgba(255,255,255,0.1)';
                }}
              />
              <button
                onClick={handleSend}
                disabled={
                  sending || !newMessage.trim()
                }
                style={{
                  width: 46, height: 46,
                  borderRadius: 23,
                  backgroundColor:
                    newMessage.trim()
                      ? '#8B5CF6'
                      : 'rgba(139,92,246,0.2)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: newMessage.trim()
                    ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  transform: newMessage.trim()
                    ? 'scale(1)' : 'scale(0.9)',
                }}
              >
                <RiSendPlaneFill
                  size={18}
                  color="white"
                />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
