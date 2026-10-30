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

  // 1. Initial Load: Restore cached messages for this meeting from localStorage
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

  // 2. Fetch persisted messages from Supabase (if configured)
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
          // Table might not exist yet, fallback to peer sync
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

  // 3. Listen to Stream custom events (real-time messages + history sync for late joiners)
  useEffect(() => {
    if (!call) return;

    const handleEvent = (event: any) => {
      if (!event || event.type !== "custom") return;
      const custom = event.custom;
      if (!custom) return;

      // New chat message received
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

      // A newly joined peer requested historical messages
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

      // Received history response from an existing peer
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

    // Request chat history from peers already present in the call
    call.sendCustomEvent({
      type: "chat-history-request",
      requesterId: user?.id,
    }).catch(console.error);

    return () => {
      (call as any).off("custom", handleEvent);
    };
  }, [call, user?.id, storageKey]);

  // 4. Send Message Handler
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
      // Broadcast to peers via Stream Call Custom Events
      await call.sendCustomEvent({
        type: "chat-message",
        message: {
          ...message,
          timestamp: message.timestamp.toISOString(),
        },
      });

      // Optimistically append sender's own message to local state
      setMessages((prev) => {
        const updated = [...prev, message];
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });

      // Persist to Supabase if available
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

  // 5. Clear Messages Handler
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
