import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, X, Send, Loader2, Sparkles, User, ChevronDown, ChevronRight, Brain } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import MarkdownMessage from './MarkdownMessage';

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  reasoning?: string;
  isTyping?: boolean;
  timestamp: Date;
}

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I'm your AI medical assistant powered by Perplexity AI. How can I help you today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, isThinking, isLoading]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const toggleThinking = (messageId: number) => {
    const newExpanded = new Set(expandedThinking);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedThinking(newExpanded);
  };

  const typeMessage = async (messageId: number, fullText: string) => {
    const characters = fullText.split('');
    let currentText = '';
    const chunkSize = 3;

    for (let i = 0; i < characters.length; i += chunkSize) {
      const chunk = characters.slice(i, i + chunkSize).join('');
      currentText += chunk;
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, text: currentText, isTyping: true }
            : msg
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 15));
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const sendQuery = async (q: string) => {
    if (!q.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date(),
    };

    setMessages((m) => [...m, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsThinking(true);

    try {
      const res = await fetch('/api/perplexity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });

      const data = await res.json();
      setIsThinking(false);

      const aiMessageId = Date.now() + 1;
      const aiMessage: Message = {
        id: aiMessageId,
        sender: 'ai',
        text: '',
        reasoning: data.reasoning,
        timestamp: new Date(),
        isTyping: true,
      };

      setMessages((m) => [...m, aiMessage]);

      const text = data?.answer || data?.result || 'No response received';
      await typeMessage(aiMessageId, text);
    } catch {
      setIsThinking(false);
      const errorMsg: Message = {
        id: Date.now() + 2,
        sender: 'ai',
        text: 'Error contacting AI. Please try again.',
        timestamp: new Date(),
      };
      setMessages((m) => [...m, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        >
          <Bot className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-purple-500 items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="w-[450px] h-[700px] shadow-2xl border-2 border-purple-500/20 flex flex-col">
            {/* Header */}
            <CardHeader className="border-b bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">MedAI Assistant</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <Badge variant="secondary" className="text-xs">Powered by Perplexity</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50/30 to-blue-50/30 dark:from-gray-900 dark:to-gray-950 scroll-smooth">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3 animate-in fade-in slide-in-from-bottom-2',
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      message.sender === 'ai'
                        ? 'bg-gradient-to-br from-purple-500 to-blue-600'
                        : 'bg-gradient-to-br from-green-500 to-emerald-600'
                    )}
                  >
                    {message.sender === 'ai' ? (
                      <Bot className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 max-w-[80%]">
                    {/* Thinking Toggle */}
                    {message.reasoning && message.sender === 'ai' && !message.isTyping && (
                      <button
                        onClick={() => toggleThinking(message.id)}
                        className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs"
                      >
                        <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium">
                          {expandedThinking.has(message.id) ? 'Hide thinking' : 'Show thinking'}
                        </span>
                        {expandedThinking.has(message.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Thinking Content */}
                    {message.reasoning && expandedThinking.has(message.id) && (
                      <div className="mb-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-xs whitespace-pre-wrap break-words leading-relaxed">
                        <div className="flex items-center gap-2 mb-2 font-semibold text-purple-700 dark:text-purple-400">
                          <Brain className="w-4 h-4" />
                          <span>Thinking Process</span>
                        </div>
                        {message.reasoning}
                      </div>
                    )}

                    {/* Message Content */}
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2 shadow-sm',
                        message.sender === 'ai'
                          ? 'bg-card border'
                          : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                      )}
                    >
                      <div className="text-sm">
                        {message.sender === 'ai' ? (
                          <MarkdownMessage content={message.text} />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{message.text}</p>
                        )}
                        {message.isTyping && (
                          <span className="inline-block w-0.5 h-4 ml-1 bg-purple-600 dark:bg-purple-400 animate-pulse" />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-xs mt-1 block',
                          message.sender === 'ai'
                            ? 'text-muted-foreground'
                            : 'text-white/70'
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl px-4 py-3 text-sm text-purple-700 dark:text-purple-300">
                    <Brain className="w-4 h-4 animate-pulse" />
                    <span className="font-medium">Thinking...</span>
                  </div>
                </div>
              )}

              {/* Loading Indicator */}
              {isLoading && !isThinking && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="bg-card border rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t bg-card p-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about medical information..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 bg-background"
                />
                <Button
                  onClick={() => sendQuery(input)}
                  disabled={!input.trim() || isLoading}
                  className="rounded-full w-10 h-10 p-0 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
