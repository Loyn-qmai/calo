import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, Send, User, Bot, RefreshCw, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { createMealPlanChat } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface MealPlannerProps {
  profile: UserProfile | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function MealPlanner({ profile }: MealPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat
    const newChat = createMealPlanChat(profile);
    setChat(newChat);
    
    // Welcome message
    setMessages([{
      role: 'assistant',
      content: `Chào bạn! Tôi là trợ lý sức khỏe của "TÔI SẼ GẦY". Với mục tiêu **${profile?.targetCalories || 2000} Calo** của bạn, tôi có thể giúp bạn lên thực đơn hoặc điều chỉnh món ăn theo ý muốn. Bạn muốn ăn gì hôm nay?`
    }]);
  }, [profile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading || !chat) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chat.sendMessage({ message: userMessage });
      const assistantMessage = response.text || "Xin lỗi, tôi gặp chút trục trặc. Bạn thử hỏi lại nhé.";
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Có lỗi xảy ra khi kết nối với AI. Vui lòng kiểm tra lại mạng." }]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    const newChat = createMealPlanChat(profile);
    setChat(newChat);
    setMessages([{
      role: 'assistant',
      content: `Chào bạn! Tôi đã sẵn sàng hỗ trợ bạn một thực đơn mới. Bạn có yêu cầu gì đặc biệt không?`
    }]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-accent-net" />
            TRỢ LÝ SỨC KHỎE
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Chat trực tiếp với AI</p>
        </div>
        <button 
          onClick={resetChat}
          className="p-2 text-slate-400 hover:text-accent-net transition-colors rounded-xl hover:bg-slate-50"
          title="Làm mới trò chuyện"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={cn(
                "flex gap-3",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1",
                msg.role === 'user' ? "bg-accent-net text-white" : "bg-slate-100 text-slate-500"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={cn(
                "max-w-[85%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed",
                msg.role === 'user' 
                  ? "bg-accent-net text-white rounded-tr-none" 
                  : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"
              )}>
                <div className="markdown-body prose-sm prose-slate max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              </div>
              <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-50 bg-white/50 backdrop-blur-sm">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi trợ lý: 'Gợi ý thực đơn cho tôi', 'Tôi không có cá, thay bằng gì?'..."
              className="flex-1 bg-slate-100 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-accent-net transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-accent-net text-white p-3.5 rounded-2xl hover:bg-blue-600 disabled:bg-slate-200 transition-all active:scale-90 flex-shrink-0 shadow-lg shadow-accent-net/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">
            AI có thể nhầm lẫn, hãy kiểm tra lại thông tin quan trọng.
          </div>
        </div>
      </div>
    </div>
  );
}

// Utility function duplicated for convenience or ensure it's imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
