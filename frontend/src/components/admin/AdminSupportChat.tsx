import { useEffect, useRef, useState } from 'react';
import { Button, Card, Flex, IconButton, ScrollArea, Text, TextArea } from '@radix-ui/themes';
import { api } from '../../api/axios';
import { useAuthStore } from '../../shared/authStore';
import { extractApiErrorMessage } from '../../shared/apiError';
import { MessageIcon, SendIcon, CloseIcon } from '../common/Icons';

type SupportMessage = {
  id: string;
  userId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: 'USER' | 'ADMIN';
  };
};

export default function AdminSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuthStore();

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages
  const loadMessages = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/support/with-admin/messages');
      if (response.data?.messages) {
        setMessages(response.data.messages);
        setUnreadCount(0);
      }
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка загрузки сообщений'));
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load messages on open
  useEffect(() => {
    if (isOpen && user) {
      void loadMessages();
    }
  }, [isOpen, user]);

  // Refresh messages periodically when open
  useEffect(() => {
    if (!isOpen || !user) return;
    const interval = setInterval(() => {
      void loadMessages();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, user]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const text = newMessage;
    setNewMessage('');

    // Optimistic update
    const tempMessage: SupportMessage = {
      id: 'temp-' + Date.now(),
      userId: user.id,
      senderId: user.id,
      text,
      createdAt: new Date().toISOString(),
      sender: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await api.post('/support/with-admin/message', { text });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempMessage.id
            ? { ...msg, id: response.data.id }
            : msg
        )
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Ошибка отправки сообщения'));
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setNewMessage(text);
      console.error('Send message error:', err);
    }
  };

  if (!user) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.5)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1.12) translateY(-4px)';
          el.style.boxShadow = '0 12px 32px rgba(124, 58, 237, 0.6)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'scale(1)';
          el.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.5)';
        }}
      >
        <MessageIcon width={28} height={28} />
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card
          style={{
            position: 'absolute',
            bottom: '80px',
            right: 0,
            width: '420px',
            height: '600px',
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-3)',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {/* Header */}
          <Flex
            align="center"
            justify="between"
            style={{
              padding: 'var(--space-3)',
              borderBottom: '1px solid var(--gray-a5)',
              background: 'linear-gradient(135deg, var(--violet-2) 0%, var(--accent-soft) 100%)',
            }}
          >
            <Flex align="center" gap="2">
              <MessageIcon width={20} height={20} />
              <Text weight="bold" size="2">
                Поддержка
              </Text>
            </Flex>
            <IconButton
              variant="ghost"
              size="1"
              onClick={() => setIsOpen(false)}
              aria-label="Закрыть"
            >
              <CloseIcon width={18} height={18} />
            </IconButton>
          </Flex>

          {/* Error */}
          {error && (
            <div style={{ padding: 'var(--space-2)', background: 'var(--red-2)' }}>
              <Text size="1" color="red">
                {error}
              </Text>
            </div>
          )}

          {/* Messages */}
          <ScrollArea
            style={{
              flex: 1,
              padding: 'var(--space-3)',
              background: 'var(--gray-a1)',
            }}
          >
            <Flex direction="column" gap="2">
              {loading && !messages.length && (
                <Text color="gray" align="center" size="2">
                  Загружаю сообщения...
                </Text>
              )}

              {!loading && messages.length === 0 && (
                <Text color="gray" align="center" size="2">
                  Нет сообщений. Начните общение с поддержкой!
                </Text>
              )}

              {messages.map((msg) => {
                const isOwn = msg.senderId === user?.id;
                const isAdmin = msg.sender?.role === 'ADMIN';

                return (
                  <Flex
                    key={msg.id}
                    align="end"
                    gap="2"
                    style={{
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Text
                      as="p"
                      size="2"
                      style={{
                        maxWidth: '300px',
                        padding: 'var(--space-2) var(--space-3)',
                        borderRadius: 'var(--radius-2)',
                        background: isAdmin
                          ? 'var(--violet-3)'
                          : isOwn
                            ? 'var(--blue-3)'
                            : 'white',
                        border: '1px solid var(--gray-a5)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {isAdmin && (
                        <Text as="span" size="1" weight="bold" color="violet">
                          Администратор: {' '}
                        </Text>
                      )}
                      {msg.text}
                    </Text>
                  </Flex>
                );
              })}
              <div ref={messagesEndRef} />
            </Flex>
          </ScrollArea>

          {/* Input */}
          <Flex
            direction="column"
            gap="2"
            style={{
              padding: 'var(--space-3)',
              borderTop: '1px solid var(--gray-a5)',
              background: 'white',
            }}
          >
            <TextArea
              placeholder="Напишите сообщение..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              style={{
                minHeight: '60px',
                maxHeight: '120px',
                resize: 'vertical',
              }}
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!newMessage.trim() || loading}
              style={{
                width: '100%',
              }}
            >
              <SendIcon width={16} height={16} />
              Отправить
            </Button>
          </Flex>
        </Card>
      )}
    </div>
  );
}
