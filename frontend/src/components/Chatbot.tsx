import { useAuth } from "@clerk/clerk-react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MarkdownContent } from "./MarkdownContent";

interface ChatbotMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotProps {
  embedded?: boolean;
  onClose?: () => void;
}

interface QuickPrompt {
  id: string;
  icon: string;
  label: string;
  prompt: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "summarize",
    icon: "💡",
    label: "Summarize Lecture",
    prompt:
      "Summarize the key concepts and discussion points of this lecture so far in clear, structured bullet points.",
  },
  {
    id: "explain",
    icon: "💻",
    label: "Explain Code",
    prompt:
      "Can you explain the main code logic, data structures, or algorithms being discussed in this class with clean code examples?",
  },
  {
    id: "quiz",
    icon: "📝",
    label: "3 Quiz Questions",
    prompt:
      "Generate 3 quick multiple-choice quiz questions (with options and explanations) based on this topic to test my understanding.",
  },
  {
    id: "review",
    icon: "⚡",
    label: "Key Takeaways",
    prompt:
      "What are the most important formulas, time/space complexities, or architectural rules to remember from today's session?",
  },
];

const INITIAL_MESSAGE: ChatbotMessage = {
  id: "welcome-1",
  text: "Hello! I'm your **AI Classroom Co-Pilot** 🚀\n\nI'm here to assist your learning in real-time:\n- 💡 **Summarize** lecture discussions & notes\n- 💻 **Explain & generate** syntax-highlighted code\n- 📝 **Test your skills** with quick concept quizzes\n\nClick any quick prompt below or ask me anything!",
  isUser: false,
  timestamp: new Date(),
};

const Chatbot = ({ embedded = false }: ChatbotProps) => {
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<ChatbotMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom smoothly on message updates or loading state
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleClearHistory = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatbotMessage = {
      id: Date.now().toString(),
      text: textToSend,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) {
      setInput("");
    }
    setIsLoading(true);

    try {
      const token = await getToken();
      const response = await fetch(
        `${import.meta.env.VITE_BE_URL}/api/chatbot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: textToSend,
            conversationHistory: messages.slice(-6).map((msg) => ({
              role: msg.isUser ? "user" : "assistant",
              content: msg.text,
            })),
          }),
        }
      );

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Rate limit reached. Please wait before asking again.");
      }

      if (response.status === 401) {
        throw new Error("Authentication required. Please sign in to use the AI Study Assistant.");
      }

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      const botMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        text:
          data.response ||
          "I apologize, but I couldn't process that response. Please try rephrasing.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);

      const errorMessage: ChatbotMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please verify your connection or try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const embeddedContent = (
    <div className="flex flex-col h-full w-full min-h-0 bg-transparent">
      {/* AI Header Sub-bar */}
      <div className="px-3.5 py-2.5 border-b border-[rgba(0,180,255,0.12)] bg-[#020b16]/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">AI Study Assistant</p>
            <p className="text-[10px] text-cyan-300/80">
              Interactive session co-pilot
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          title="Reset conversation"
          type="button"
          className="p-1 rounded-md text-neutral-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 no-scrollbar">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-2.5 ${
              message.isUser ? "justify-end" : "justify-start"
            }`}
          >
            {!message.isUser && (
              <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                message.isUser
                  ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-[0_2px_10px_rgba(0,180,255,0.2)]"
                  : "bg-[#0c1a2e]/95 text-neutral-100 rounded-tl-none border border-[rgba(0,180,255,0.16)] shadow-sm"
              }`}
            >
              <MarkdownContent content={message.text} isUser={message.isUser} />
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start items-center text-xs text-neutral-400">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            </div>
            <div className="px-3 py-2 rounded-2xl bg-[#0c1a2e]/90 border border-[rgba(0,180,255,0.14)] text-cyan-300 text-xs flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Prompt Chips Bar */}
      <div className="px-3 pt-2 pb-1.5 border-t border-[rgba(0,180,255,0.08)] bg-[#020b16]/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex-shrink-0 mr-0.5 select-none">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick:</span>
        </div>
        {QUICK_PROMPTS.map((item) => (
          <button
            key={item.id}
            onClick={() => sendMessage(item.prompt)}
            disabled={isLoading}
            type="button"
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#07162b]/90 hover:bg-cyan-500/15 border border-[rgba(0,180,255,0.18)] hover:border-cyan-400/50 text-cyan-200 hover:text-white transition-all duration-150 disabled:opacity-40 active:scale-95 shadow-sm"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-[rgba(0,180,255,0.12)] bg-[#020b16]/95">
        <div className="flex gap-2 items-center">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask AI anything about this lecture..."
            disabled={isLoading}
            className="flex-1 h-9 text-xs rounded-xl bg-[#061527]/90 border-[rgba(0,180,255,0.2)] text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-cyan-400"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-9 w-9 p-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-40 shadow-[0_0_12px_rgba(0,180,255,0.25)] flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return embeddedContent;
  }

  // Floating Fallback Window
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? "w-80 h-12" : "w-88 h-[460px]"
      }`}
    >
      <div className="rounded-2xl border border-[rgba(0,180,255,0.25)] bg-[#020813]/95 backdrop-blur-xl shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[rgba(0,180,255,0.15)] bg-[#040e1c]/80">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-white">AI Study Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              title="Reset conversation"
              className="h-6 w-6 p-0 text-white/60 hover:text-cyan-300 hover:bg-white/[0.06]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/[0.06]"
            >
              {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 no-scrollbar">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!message.isUser && (
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      message.isUser
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-tr-none shadow-[0_2px_10px_rgba(0,180,255,0.2)]"
                        : "bg-[#0c1a2e]/95 text-neutral-100 rounded-tl-none border border-[rgba(0,180,255,0.16)]"
                    }`}
                  >
                    <MarkdownContent
                      content={message.text}
                      isUser={message.isUser}
                    />
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2 justify-start items-center text-xs text-neutral-400">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                  </div>
                  <div className="px-2.5 py-1.5 rounded-xl bg-[#0c1a2e]/90 border border-[rgba(0,180,255,0.14)] text-cyan-300 text-[11px] flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Prompt Chips Bar */}
            <div className="px-3 pt-2 pb-1.5 border-t border-[rgba(0,180,255,0.08)] bg-[#020b16]/90 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {QUICK_PROMPTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => sendMessage(item.prompt)}
                  disabled={isLoading}
                  type="button"
                  className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#07162b]/90 hover:bg-cyan-500/15 border border-[rgba(0,180,255,0.18)] hover:border-cyan-400/50 text-cyan-200 hover:text-white transition-all duration-150 disabled:opacity-40"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-2.5 border-t border-[rgba(0,180,255,0.15)] bg-[#040e1c]/90">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask AI anything..."
                  disabled={isLoading}
                  className="flex-1 h-8 text-xs rounded-xl bg-[#061527]/90 border-[rgba(0,180,255,0.2)] text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-cyan-400"
                />
                <Button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-8 w-8 p-0 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-40 shadow-sm flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
