import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useCall } from '@stream-io/video-react-sdk';
import { useUser } from '@clerk/clerk-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  text: string;
  timestamp: Date;
}

interface ChatContextType {
  messages: ChatMessage[];
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const call = useCall();
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const storageKey = call?.id ? `meeting_chat_${call.id}` : null;

  // restore cache
  useEffect(() => {
    if (!storageKey) return;
    try {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const hydrated = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));
          setMessages(hydrated);
        }
      }
    } catch (err) {
      console.warn("Failed to load cached chat messages:", err);
    }
  }, [storageKey]);

  // fetch supabase
  useEffect(() => {
    if (!call?.id || !isSupabaseConfigured) return;

    let isMounted = true;
    const fetchPersistedHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('meeting_messages')
          .select('*')
          .eq('meeting_id', call.id)
          .order('created_at', { ascending: true });

        if (error) {
          // peer fallback
          return;
        }

        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newEntries = data
              .filter((row) => !existingIds.has(row.id))
              .map((row) => ({
                id: row.id,
                userId: row.user_id,
                userName: row.user_name,
                userImage: row.user_image,
                text: row.text,
                timestamp: new Date(row.created_at),
              }));

            if (newEntries.length === 0) return prev;
            const combined = [...prev, ...newEntries].sort(
              (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
            );
            if (storageKey) {
              localStorage.setItem(storageKey, JSON.stringify(combined));
            }
            return combined;
          });
        }
      } catch (err) {
        console.warn("Supabase chat fetch error:", err);
      }
    };

    fetchPersistedHistory();

    return () => {
      isMounted = false;
    };
  }, [call?.id, storageKey]);

  // message listener
  useEffect(() => {
    if (!call) return;

    const handleEvent = (event: any) => {
      if (!event || event.type !== "custom") return;
      const custom = event.custom;
      if (!custom) return;

      // receive message
      if (custom.type === "chat-message" && custom.message) {
        const msg = custom.message;
        const newMsg: ChatMessage = {
          ...msg,
          timestamp: new Date(msg.timestamp),
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const updated = [...prev, newMsg];
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          }
          return updated;
        });
      }

      // peer history
      if (custom.type === "chat-history-request") {
        if (custom.requesterId && custom.requesterId === user?.id) return;
        const currentMsgs = messagesRef.current;
        if (currentMsgs.length > 0) {
          call.sendCustomEvent({
            type: "chat-history-response",
            targetId: custom.requesterId,
            messages: currentMsgs.map((m) => ({
              ...m,
              timestamp: m.timestamp.toISOString(),
            })),
          }).catch(console.error);
        }
      }

      // sync history
      if (custom.type === "chat-history-response") {
        if (custom.targetId && custom.targetId !== user?.id) return;
        if (Array.isArray(custom.messages) && custom.messages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const fresh = custom.messages
              .filter((m: any) => !existingIds.has(m.id))
              .map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }));

            if (fresh.length === 0) return prev;
            const merged = [...prev, ...fresh].sort(
              (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
            );
            if (storageKey) {
              localStorage.setItem(storageKey, JSON.stringify(merged));
            }
            return merged;
          });
        }
      }
    };

    (call as any).on("custom", handleEvent);

    // request history
    call.sendCustomEvent({
      type: "chat-history-request",
      requesterId: user?.id,
    }).catch(console.error);

    return () => {
      (call as any).off("custom", handleEvent);
    };
  }, [call, user?.id, storageKey]);

  // send message
  const sendMessage = useCallback(async (messageData: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!call) return;

    const generateSafeId = () => {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    };

    const message: ChatMessage = {
      ...messageData,
      id: generateSafeId(),
      timestamp: new Date(),
    };

    try {
      // broadcast message
      await call.sendCustomEvent({
        type: "chat-message",
        message: {
          ...message,
          timestamp: message.timestamp.toISOString(),
        },
      });

      // optimistic append
      setMessages((prev) => {
        const updated = [...prev, message];
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });

      // save supabase
      if (isSupabaseConfigured && call.id) {
        try {
          await supabase.from('meeting_messages').insert({
            id: message.id,
            meeting_id: call.id,
            user_id: message.userId,
            user_name: message.userName,
            user_image: message.userImage,
            text: message.text,
            created_at: message.timestamp.toISOString(),
          });
        } catch (dbErr) {
          console.warn("Supabase message persist error:", dbErr);
        }
      }
    } catch (err) {
      console.error("Failed to send message", err);
    }
  }, [call, storageKey]);

  // clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    if (call) {
      call.update({
        custom: {
          ...call.state.custom,
          chatMessages: [],
        },
      }).catch(console.error);
    }
  }, [call, storageKey]);

  return (
    <ChatContext.Provider value={{ messages, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
