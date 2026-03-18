import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Wand2, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../api/axios';

export function AiAnalytics() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('koni_ai_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: 'Halo! Saya AI Assistant khusus KONI. Saya dapat membantu memberikan total data dan daftar cabang olahraga (cabor) beserta statistik atletnya. Apa yang ingin Anda ketahui hari ini?'
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('koni_ai_chat_history', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    
    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Prepare message history for API
    const apiMessages = [...messages, userMessage].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    try {
      const token = localStorage.getItem('token');
      // Use raw Fetch (not Axios) to be able to stream SSE response,
      // but reuse the baseURL from the shared axios instance.
      const baseURL = api.defaults.baseURL || 'http://localhost:8080';
      const response = await fetch(`${baseURL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages: apiMessages })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Akses Ditolak: Hanya Superadmin yang dapat menggunakan fitur ini.');
        }
        if (response.status === 500) {
          throw new Error('Terjadi kesalahan pada AI provider (Z.ai). Periksa apakah API Key valid dan saldo Z.ai mencukupi.');
        }
        throw new Error(`Gagal menghubungi asisten (HTTP ${response.status})`);
      }


      // Add a placeholder assistant message that we will stream text into
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        // The SSE format usually sends "data: {...}\n\n"
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                // Backend signals an error via the SSE body
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.content) {
                  // Replace '\\n' from JSON back to actual newlines
                  const textChunk = parsed.content.replace(/\\n/g, '\n');
                  
                  // Update the last message (the assistant's current response)
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastIndex = newMessages.length - 1;
                    newMessages[lastIndex] = {
                      ...newMessages[lastIndex],
                      content: newMessages[lastIndex].content + textChunk
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // If it's an Error we threw ourselves (SSE error), re-throw it
                if (e instanceof Error && e.message !== 'SyntaxError') {
                  throw e;
                }
                console.error("Failed to parse stream chunk:", e, "Chunk Data:", dataStr);
              }
            }
          }
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err.message || 'Gagal menghubungi asisten AI.');
      // Remove the last message if it was an empty assistant stub
      setMessages(prev => {
        if (prev[prev.length - 1]?.content === '') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat percakapan ini?")) {
      const initialMessages = [
        {
          role: 'assistant',
          content: 'Halo! Saya AI Assistant khusus KONI. Saya dapat membantu memberikan total data dan daftar cabang olahraga (cabor) beserta statistik atletnya. Apa yang ingin Anda ketahui hari ini?'
        }
      ];
      setMessages(initialMessages);
      localStorage.setItem('koni_ai_chat_history', JSON.stringify(initialMessages));
      setError(null);
    }
  };

  return (
    <DashboardLayout title="AI Analytics" subtitle="Analisis cerdas dan insights data KONI">
      <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[500px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        
        {/* Header */}
      <div className="bg-white border-b border-slate-200 p-4 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              AI Analytics <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700">Beta</span>
            </h1>
            <p className="text-xs text-slate-500">Superpowered by Large Language Models</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex items-start gap-4 max-w-4xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-sm ${
              message.role === 'user' 
                ? 'bg-red-600 text-white' 
                : 'bg-indigo-600 text-white'
            }`}>
              {message.role === 'user' ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'} min-w-0 max-w-[85%]`}>
              <div 
                className={`px-4 sm:px-5 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-red-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm sm:prose-base max-w-none prose-slate prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-6 rounded-lg border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 m-0" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                        tbody: ({node, ...props}) => <tbody className="divide-y divide-slate-200 bg-white" {...props} />,
                        tr: ({node, ...props}) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
                        th: ({node, ...props}) => (
                          <th className="px-4 py-3 text-left border-b-0 text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap" {...props} />
                        ),
                        td: ({node, ...props}) => (
                          <td className="px-4 py-3 border-b-0 text-sm xl:text-base text-slate-700 whitespace-normal" {...props} />
                        ),
                        a: ({node, ...props}) => (
                          <a className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2" {...props} />
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 px-1">
                {message.role === 'user' ? 'Anda' : 'AI Assistant'}
              </span>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex items-start gap-4 max-w-4xl mx-auto">
            <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="bg-white border border-slate-200 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-6 shrink-0">
        <div className="max-w-4xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 sm:p-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Tanya statistik atlet, riwayat, atau cabor..."
              className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 min-h-[44px] p-2 sm:p-3 text-sm text-slate-800 placeholder:text-slate-400 py-2 scrollbar-thin scrollbar-thumb-slate-300"
              rows={1}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="mb-1 shrink-0 p-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center justify-center shadow-md disabled:shadow-none"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <div className="mt-2 text-center">
             <p className="text-[11px] text-slate-400">
               Tekan <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Enter</kbd> untuk mengirim, <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Shift + Enter</kbd> untuk baris baru.
             </p>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
