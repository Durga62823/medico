import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Send, Mic, Calendar, FileText, Heart, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  type?: "text" | "appointment" | "vitals" | "prescription";
}

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hello! I'm MedAI, your healthcare assistant. How can I help you today?",
    sender: "ai",
    timestamp: new Date(),
    type: "text",
  },
];

const quickActions = [
  { label: "Check Vitals", icon: Heart, action: "vitals" },
  { label: "Schedule Appointment", icon: Calendar, action: "appointment" },
  { label: "View Reports", icon: FileText, action: "reports" },
  { label: "Medication Info", icon: Bot, action: "medication" },
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: "user",
      timestamp: new Date(),
      type: "text",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(text),
        sender: "ai",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();

    if (input.includes("appointment") || input.includes("schedule")) {
      return "I can help you schedule an appointment. Dr. Smith is available Tuesday 2 PM or Wednesday 10 AM. Which do you prefer?";
    }
    if (input.includes("vitals") || input.includes("health")) {
      return "Your vitals are stable: Heart rate 72 BPM, Blood pressure 118/76 mmHg, Oxygen saturation 98%.";
    }
    if (input.includes("medication") || input.includes("prescription")) {
      return "You are currently on Lisinopril 10mg daily and Metformin 500mg twice daily. Refill in 15 days.";
    }
    if (input.includes("symptoms") || input.includes("pain")) {
      return "Can you describe the pain (1-10) and when it started? This will help me provide better guidance.";
    }
    return "I understand your question. I recommend discussing this with your healthcare provider. Want me to summarize your recent health data?";
  };

  const handleQuickAction = (action: string) => {
    const actionMessages = {
      vitals: "Show me my current vital signs",
      appointment: "I'd like to schedule an appointment",
      reports: "Can you show me my recent lab reports?",
      medication: "Tell me about my current medications",
    };
    handleSendMessage(actionMessages[action as keyof typeof actionMessages]);
  };

  return (
    <Card className="flex flex-col h-[90vh] w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ai-accent to-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">MedAI Assistant</CardTitle>
            <CardDescription>AI-powered healthcare support</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto">
            Online
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 min-h-0">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.action}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center space-x-1 text-xs"
              >
                <IconComponent className="w-3 h-3" />
                <span>{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-4 p-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex space-x-2 max-w-[80%] ${
                      message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback
                        className={`${
                          message.sender === "ai"
                            ? "bg-gradient-to-br from-ai-accent to-primary text-white"
                            : "bg-secondary"
                        }`}
                      >
                        {message.sender === "ai" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`rounded-lg p-3 ${
                        message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm break-words">{message.text}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-70">
                          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-gradient-to-br from-ai-accent to-primary text-white">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                        <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="flex space-x-2 mt-2">
          <Input
            placeholder="Ask me about your health, symptoms, or appointments..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
            className="flex-1"
          />
          <Button size="sm" onClick={() => handleSendMessage(inputValue)} className="bg-gradient-primary">
            <Send className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Mic className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
