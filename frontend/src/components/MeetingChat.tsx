import { useState, useEffect, useRef } from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import { Send, X, MessageSquare } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChat } from "@/contexts/ChatContext";

interface MeetingChatProps {
  onClose?: () => void;
  embedded?: boolean;
}

const MeetingChat = ({ onClose, embedded = false }: MeetingChatProps) => {
  const { user } = useUser();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const { messages, sendMessage } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !user) return;

    sendMessage({
      userId: user.id,
      userName: user.username || user.fullName || user.firstName || user.id,
      userImage: user.imageUrl,
      text: inputMessage.trim(),
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date | string | number) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserName = (userId: string, userName?: string) => {
    if (userId === user?.id) return "You";
    if (userName) return userName;
    const participant = participants.find((p) => p.userId === userId);
    if (participant?.name) return participant.name;
    return userId || "Unknown";
  };

  const getUserImage = (userId: string, userImage?: string) => {
    if (userId === user?.id) return user?.imageUrl;
    if (userImage) return userImage;
    const participant = participants.find((p) => p.userId === userId);
    return participant?.image || undefined;
  };

  const content = (
    <div className="flex flex-col h-full w-full min-h-0">
      {/* Standalone Header */}
      {!embedded && (
        <div className="flex items-center justify-between p-4 border-b border-light-4 dark:border-dark-4">
          <h2 className="text-lg font-semibold text-dark-2 dark:text-white">
            Chat
          </h2>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-dark-2 dark:text-white hover:bg-light-3 dark:hover:bg-dark-3"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 no-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-neutral-400">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              No messages yet
            </p>
            <p className="text-xs text-neutral-400 max-w-[220px]">
              Send a note, link, or question to everyone in the session.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.userId === user?.id;
            const displayName = getUserName(message.userId, message.userName);
            const displayImage = getUserImage(
              message.userId,
              message.userImage
            );

            return (
              <div
                key={message.id}
                className={`flex gap-2.5 ${
                  isCurrentUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* User Avatar */}
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={displayName}
                    className="w-7 h-7 rounded-full flex-shrink-0 object-cover mt-0.5 border border-white/10"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Message Content */}
                <div
                  className={`flex flex-col max-w-[80%] ${
                    isCurrentUser ? "items-end" : "items-start"
                  }`}
                >
                  {!isCurrentUser && (
                    <span className="text-[11px] font-medium text-neutral-400 mb-1 px-1">
                      {displayName}
                    </span>
                  )}
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-[0_2px_10px_rgba(0,180,255,0.2)]"
                        : "bg-[#0b192c]/90 text-neutral-100 rounded-tl-none border border-[rgba(0,180,255,0.14)] shadow-sm"
                    }`}
                  >
                    {message.text}
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 px-1">
                    {formatTime(new Date(message.timestamp))}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-[rgba(0,180,255,0.12)] bg-[#020b16]/70">
        <div className="flex gap-2 items-center">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 h-9 text-xs rounded-xl bg-[#061527]/90 border-[rgba(0,180,255,0.2)] text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-cyan-400"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="h-9 w-9 p-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-40 shadow-[0_0_12px_rgba(0,180,255,0.25)] flex-shrink-0"
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-86px)] w-[350px] bg-light-1 dark:bg-dark-1 border-l border-light-4 dark:border-dark-4 transition-colors">
      {content}
    </div>
  );
};

export default MeetingChat;
