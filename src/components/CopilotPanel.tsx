import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { getCopilotResponse } from '@/lib/copilotEngine';
import { Clash, MEPElement } from '@/lib/clashEngine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CopilotPanelProps {
  clashes: Clash[];
  elements: MEPElement[];
  onRerouteAll?: () => void;
  isAnalyzing?: boolean;
}

export default function CopilotPanel({ clashes, elements }: CopilotPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [side, setSide] = useState<'right' | 'left'>('right');
  const [width, setWidth] = useState(380);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '## 🤖 BIM Copilot\n\nHello! I\'m your AI assistant for clash detection and rerouting. Type **"help"** to see what I can do, or ask me anything about your model!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(scrollToBottom, [messages, isTyping, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getCopilotResponse(input, { clashes, elements });
    setIsTyping(false);
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() }]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    resizeRef.current = { startX: e.clientX, startWidth: width };
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = side === 'right'
        ? resizeRef.current.startX - e.clientX
        : e.clientX - resizeRef.current.startX;
      setWidth(Math.max(320, Math.min(700, resizeRef.current.startWidth + delta)));
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-bg flex items-center justify-center animate-pulse-glow cursor-pointer transition-transform hover:scale-110"
        >
          <Bot className="w-7 h-7 text-primary-foreground" />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          className={`fixed top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full z-50 flex animate-fade-in`}
          style={{ width }}
        >
          {/* Resize handle */}
          <div
            onMouseDown={handleMouseDown}
            className={`w-2 cursor-col-resize flex items-center justify-center hover:bg-primary/10 transition-colors ${side === 'right' ? 'order-first' : 'order-last'}`}
          >
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>

          {/* Panel content */}
          <div className="flex-1 flex flex-col glass-panel border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 gradient-bg">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-foreground" />
                <span className="font-semibold text-primary-foreground text-sm">BIM Copilot</span>
                <span className="text-xs bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full">AI</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === 'user'
                      ? 'gradient-bg text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-td:text-foreground prose-th:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-4 py-3 rounded-bl-sm flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about clashes, rerouting..."
                  className="flex-1 bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground"
                />
                <Button size="icon" className="gradient-bg h-9 w-9" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
