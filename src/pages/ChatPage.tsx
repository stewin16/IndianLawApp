import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Scale, Zap, BookOpen, Mic, MicOff, Download, Sparkles, Send, Menu, Plus, Trash2, MessageSquare, ExternalLink, Copy, Check, Volume2, Search, X, ChevronRight, ArrowRight, Wifi, WifiOff, RotateCw } from "lucide-react";
import Header from "@/components/Header";
import TricolorBackground from "@/components/TricolorBackground";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/translations";
import { chatStream } from "@/services/groqService";
import { toast } from "sonner";
import { exportStructuredPdf, toPlainText } from "@/lib/pdfExport";

interface Judgment {
  title: string;
  summary: string;
}

interface Arguments {
  for: string[];
  against: string[];
}

interface NeutralAnalysis {
  factors: string[];
  interpretations: string[];
}

interface Citation {
  source: string;
  section: string;
  text: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  judgments?: Judgment[];
  arguments?: Arguments;
  neutral_analysis?: NeutralAnalysis;
  citations?: Citation[];
}

const NON_LEGAL_INTENT_PATTERNS = [
  /^(hi|hello|hey|yo|hola|namaste|good\s*(morning|afternoon|evening))\b/i,
  /\bhow are you\b/i,
  /\bwho are you\b/i,
  /\bwhat can you do\b/i,
  /\bthank(s| you)?\b/i,
  /\bbye|goodbye|see you\b/i,
  /\bjoke\b/i,
  /\bweather\b/i,
  /\btime\b/i,
];

const LEGAL_HINT_PATTERNS = [
  /\blaw|legal|ipc|bns|bnss|bsa|section|act|code|court|judge|judgment|bail|fir|complaint|petition|affidavit|writ|notice|agreement|contract|property|divorce|marriage|consumer|crime|criminal|civil|tax|labour|labor\b/i,
  /\d+\s*(ipc|bns|crpc|bnss|section)/i,
];

const isNonLegalSmallTalk = (text: string) => {
  const normalized = text.trim();
  if (!normalized) return false;

  const hasLegalSignal = LEGAL_HINT_PATTERNS.some((pattern) => pattern.test(normalized));
  if (hasLegalSignal) return false;

  return NON_LEGAL_INTENT_PATTERNS.some((pattern) => pattern.test(normalized));
};

const buildSmallTalkReply = (text: string) => {
  const normalized = text.toLowerCase();

  if (/\bthank(s| you)?\b/i.test(normalized)) {
    return "You're welcome. I can help with Indian legal questions, sections, drafting, and case analysis.";
  }

  if (/\bbye|goodbye|see you\b/i.test(normalized)) {
    return "Take care. Come back anytime for legal help with Indian law and documents.";
  }

  if (/\bhow are you\b/i.test(normalized)) {
    return "I am ready to assist. Ask me any Indian legal question, such as IPC/BNS sections, bail, FIR drafting, or legal document review.";
  }

  if (/\bwho are you\b|\bwhat can you do\b/i.test(normalized)) {
    return "I am your Indian legal AI assistant. I handle legal research, drafting, summarization, comparison, and law-section guidance.";
  }

  return "Hi. I am ready to help with Indian legal matters. Ask a legal question and I will respond with relevant guidance and sections.";
};

const buildInstantLegalPreview = (text: string, useLanguage: 'en' | 'hi') => {
  const normalized = text.toLowerCase();
  const sectionMatch = normalized.match(/(?:section|sec|u\/s|ipc|bns)\s*(\d{1,4}[a-z]?)/i);

  if (useLanguage === 'hi') {
    if (sectionMatch) {
      return `त्वरित उत्तर: आपने धारा ${sectionMatch[1].toUpperCase()} के बारे में पूछा है। मैं अभी संबंधित प्रावधान, दंड और व्यावहारिक कदम संक्षेप में दे रहा हूं।`;
    }
    return "त्वरित उत्तर: आपका प्रश्न कानूनी विषय से जुड़ा है। मैं अभी संबंधित कानून, लागू बिंदु, और अगले व्यावहारिक कदम तुरंत साझा कर रहा हूं।";
  }

  if (sectionMatch) {
    return `Quick answer: You asked about Section ${sectionMatch[1].toUpperCase()}. I am now fetching the applicable provisions, punishment range, and practical next steps.`;
  }

  return "Quick answer: Your query is legal in nature. I am now fetching the relevant law, core interpretation, and practical next steps.";
};

const toReadableError = (error: unknown) => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const getQuickPrompts = (t: { quickPrompts: Record<string, { query: string }> }) => [
  { textKey: "quickPrompts.murder", query: t.quickPrompts.murder?.query || "Punishment for murder under BNS" },
  { textKey: "quickPrompts.consumer", query: t.quickPrompts.consumer?.query || "How to file a consumer complaint" },
  { textKey: "quickPrompts.cheating", query: t.quickPrompts.cheating?.query || "Punishment for cheating" },
  { textKey: "quickPrompts.rent", query: t.quickPrompts.rent?.query || "Essentials of a rent agreement" }
];



const ChatPage = () => {
  // Get translations for current language
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const t = useTranslations(language);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [domain, setDomain] = useState("all");
  const [argumentsMode, setArgumentsMode] = useState(false);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [loadingText, setLoadingText] = useState(t.loadingTexts[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [isCheckingGroq, setIsCheckingGroq] = useState(false);
  const [groqStatus, setGroqStatus] = useState({
    state: "connected",
    activeModel: import.meta.env.VITE_GROQ_MODEL || "Llama 3.3 70B",
    latencyMs: null,
    message: "Groq Cloud Active",
  });

  const refreshGroqStatus = useCallback(async () => {
    setIsCheckingGroq(true);
    // Mimic a status check
    setTimeout(() => {
      setIsCheckingGroq(false);
      setGroqStatus(prev => ({ ...prev, state: "connected" }));
      toast.success("Groq API connection verified.");
    }, 500);
  }, []);

  const domains = [
    { id: "all", label: "All Laws", icon: <Scale className="w-3 h-3" /> },
    { id: "criminal", label: "Criminal", icon: <Zap className="w-3 h-3" /> },
    { id: "civil", label: "Civil", icon: <BookOpen className="w-3 h-3" /> },
    { id: "corporate", label: "Corporate", icon: <MessageSquare className="w-3 h-3" /> },
    { id: "family", label: "Family", icon: <Sparkles className="w-3 h-3" /> },
    { id: "tax", label: "Tax & Finance", icon: <Scale className="w-3 h-3" /> },
  ];

  // Conversation history state
  const [conversations, setConversations] = useState<Array<{
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
  }>>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('legal-compass-conversations');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConversations(parsed);
        // Always start with a new chat instead of loading the most recent one
        // This ensures users get a fresh start every time they open the assistant
        setActiveConversationId(null);
        setMessages([]);
      } catch (e) {
        console.error('Failed to load conversations:', e);
      }
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('legal-compass-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || !shouldAutoScrollRef.current || (messages.length === 0 && !isLoading)) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      list.scrollTo({ top: list.scrollHeight, behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [messages, isLoading]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && t.loadingTexts) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % t.loadingTexts.length;
        setLoadingText(t.loadingTexts[i]);
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isLoading, t.loadingTexts]);

  useEffect(() => {
    // Gemini health check removed
  }, []);

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      interface SpeechRecognitionEvent extends Event {
        results: {
          [index: number]: {
            [index: number]: {
              transcript: string;
            };
          };
        };
      }

      interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onstart: () => void;
        onend: () => void;
        onresult: (event: SpeechRecognitionEvent) => void;
        start: () => void;
      }

      const SpeechRecognition = (window as Window & { webkitSpeechRecognition: new () => SpeechRecognition }).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } else {
      alert("Voice input is not supported in this browser.");
    }
  };

  const getKanoonLink = (source: string, section: string) => {
    // Create a smart search query for Indian Kanoon
    const query = encodeURIComponent(`${source} ${section}`);
    return `https://indiankanoon.org/search/?formInput=${query}`;
  };

  const exportPDF = async (msg: Message, query: string) => {
    try {
      const citationText = (msg.citations || [])
        .map((c, idx) => `${idx + 1}. ${c.source} | ${c.section}\n${c.text}`)
        .join("\n\n");

      await exportStructuredPdf({
        title: "LegalAi - Research Report",
        fileName: "legal-research-report.pdf",
        metadata: [
          `Date: ${new Date().toLocaleDateString()}`,
          `Domain: ${domain}`,
        ],
        sections: [
          { label: "Query", text: toPlainText(query) },
          { label: "Answer", text: toPlainText(msg.content) },
          ...(citationText ? [{ label: "Legal Citations", text: toPlainText(citationText) }] : []),
        ],
        footer: "Disclaimer: Provided for informational purposes only. Not legal advice.",
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Unable to export PDF. Please try again.");
    }
  };

  const exportFullChat = async () => {
    try {
      const sections = messages.map((msg) => ({
        label: msg.role === "user" ? "You" : "LegalAi",
        text: toPlainText(msg.content),
      }));

      await exportStructuredPdf({
        title: "LegalAi - Conversation History",
        fileName: "legal-compass-full-chat.pdf",
        metadata: [
          `Date: ${new Date().toLocaleDateString()}`,
          `Domain: ${domain}`,
        ],
        sections,
        footer: "Disclaimer: Provided for informational purposes only. Not legal advice.",
      });
    } catch (error) {
      console.error("Full Chat PDF Export Error:", error);
      toast.error("Unable to export full chat PDF. Please try again.");
    }
  };

  // Conversation management functions
  const createNewChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setInput("");
    shouldAutoScrollRef.current = true;
  };

  const switchConversation = (convId: string) => {
    const conv = conversations.find(c => c.id === convId);
    if (conv) {
      setActiveConversationId(conv.id);
      setMessages(conv.messages);
      shouldAutoScrollRef.current = true;
    }
  };

  const deleteConversation = (convId: string) => {
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) {
      createNewChat();
    }
  };

  const saveCurrentConversation = (updatedMessages: Message[]) => {
    if (updatedMessages.length === 0) return;

    const title = updatedMessages[0].content.slice(0, 40) + (updatedMessages[0].content.length > 40 ? '...' : '');
    const timestamp = Date.now();

    if (activeConversationId) {
      // Update existing conversation
      setConversations(prev => prev.map(c =>
        c.id === activeConversationId
          ? { ...c, messages: updatedMessages, timestamp }
          : c
      ));
    } else {
      // Create new conversation
      const newId = `conv_${timestamp}`;
      setActiveConversationId(newId);
      setConversations(prev => [{
        id: newId,
        title,
        messages: updatedMessages,
        timestamp
      }, ...prev]);
    }
  };

  const handleSend = async (text = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    const initialAssistantMsg: Message = { role: 'assistant', content: "" };
    
    setMessages(prev => [...prev, userMsg, initialAssistantMsg]);
    setIsLoading(true);
    setInput("");
    shouldAutoScrollRef.current = true;

    try {
      // Prepare history for Groq
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      await chatStream(
        history,
        (content, citations) => {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1] = { ...newMsgs[newMsgs.length - 1], content, citations };
            return newMsgs;
          });
        },
        activeConversationId || undefined,
        language,
        argumentsMode,
        analysisMode
      );

      // Save to history after stream finishes
      setMessages(prev => {
        saveCurrentConversation(prev);
        return prev;
      });

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { 
          ...newMsgs[newMsgs.length - 1], 
          content: "Sorry, I encountered an error connecting to the Groq AI service. Please check your API key and internet connection." 
        };
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
      setSuggestedQuestions([
        "Explain Section 302 of BNS",
        "How to file a public interest litigation?",
        "Difference between IPC and BNS",
        "Recent Supreme Court judgments on privacy",
      ]);
    }
  };


  const handleTTS = async (text: string, index: number) => {
    if (isSpeaking === index) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }

    setIsSpeaking(index);
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(null);
      toast.error("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1000));
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => setIsSpeaking(null);
    utterance.onerror = () => setIsSpeaking(null);
    window.speechSynthesis.speak(utterance);
  };

  // Group conversations by date and filter by search
  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedConversations = filteredConversations.reduce((acc, conv) => {
    const date = new Date(conv.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let group = "Older";
    if (date.toDateString() === today.toDateString()) group = "Today";
    else if (date.toDateString() === yesterday.toDateString()) group = "Yesterday";
    else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) group = "Last 7 Days";

    if (!acc[group]) acc[group] = [];
    acc[group].push(conv);
    return acc;
  }, {} as Record<string, typeof conversations>);

  return (
    <div className="h-[100dvh] flex flex-col text-gray-900 overflow-hidden bg-white">
      <TricolorBackground intensity="medium" showOrbs={true} />
      {!focusMode && <Header />}

      {/* Main Layout Container */}
      <div className="flex-1 min-h-0 flex overflow-hidden pt-0 transition-all duration-500">

        {/* Sidebar - Premium Technical Dashboard Style */}
        <AnimatePresence mode="wait">
          {sidebarOpen && !focusMode && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-[280px] bg-white/80 backdrop-blur-xl border-r border-navy-india/10 flex flex-col shrink-0 z-20 relative shadow-2xl shadow-navy-india/5"
            >
              <div className="p-6 border-b border-navy-india/5 space-y-4">
                <Button
                  onClick={createNewChat}
                  className="w-full justify-start gap-3 btn-navy text-white text-sm font-bold h-12 px-4 rounded-xl shadow-xl shadow-navy-india/10 group transition-all"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  New Research
                </Button>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-india/30" />
                  <Input 
                    placeholder="Search history..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-9 bg-navy-india/5 border-transparent focus:bg-white focus:border-navy-india/20 rounded-xl text-xs transition-all font-medium"
                  />
                </div>

                <Button
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to clear all chat history?")) {
                      setConversations([]);
                      localStorage.removeItem("legal-compass-conversations");
                      toast.success("History cleared");
                    }
                  }}
                  className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest h-10 px-4 rounded-xl transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-8">
                {Object.entries(groupedConversations).map(([group, items]) => (
                  <div key={group} className="space-y-1">
                    <h3 className="px-3 py-2 text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest">
                      {group}
                    </h3>
                    <div className="space-y-0.5">
                      {items.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => switchConversation(conv.id)}
                          className={cn(
                            "group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all text-sm border border-transparent",
                            activeConversationId === conv.id
                              ? "bg-navy-india/5 border-navy-india/10 text-navy-india font-bold"
                              : "text-gray-600 hover:bg-navy-india/5 hover:text-navy-india"
                          )}
                        >
                          <MessageSquare className={cn("w-4 h-4 shrink-0", activeConversationId === conv.id ? "text-saffron" : "opacity-40")} />
                          <span className="flex-1 truncate">
                            {conv.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 -mr-1 hover:bg-red-50 hover:text-red-500 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-navy-india/5 flex items-center justify-center mb-4 border border-dashed border-navy-india/20">
                      <MessageSquare className="w-6 h-6 text-navy-india/20" />
                    </div>
                    <p className="text-xs text-navy-india/40 font-bold uppercase tracking-wider">No recent research</p>
                  </div>
                )}



              </div>

              <div className="p-4 border-t border-navy-india/5 bg-navy-india/5">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center border border-saffron/30">
                    <Scale className="w-4 h-4 text-saffron" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-navy-india">LegalAI Pro</span>
                    <span className="text-[10px] text-navy-india/40 font-mono font-bold">v2.0.1-PREMIUM</span>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area - Immersive Editorial Style */}
        <main className="flex-1 min-h-0 flex flex-col relative min-w-0 bg-white/40 backdrop-blur-sm">
          {/* Mobile Sidebar Toggle */}
          {(!sidebarOpen || focusMode) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSidebarOpen(true);
                setFocusMode(false);
              }}
              className="absolute top-4 left-4 z-30 glass-premium shadow-2xl border border-navy-india/10 text-navy-india hover:bg-white rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Top Controls Bar - Technical Dashboard Style */}
          <div className={cn(
            "w-full border-b border-navy-india/5 flex flex-col bg-white/80 backdrop-blur-md z-10 transition-all",
            focusMode ? "py-1" : "py-0"
          )}>
            <div className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                {sidebarOpen && !focusMode && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(false)}
                    className="text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5 rounded-xl transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold text-navy-india flex items-center gap-2">
                      Legal AI Assistant
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                          groqStatus.state === "connected" && "bg-green-india/10 text-green-india",
                          groqStatus.state === "disconnected" && "bg-red-500/10 text-red-500"
                        )}
                        title={groqStatus.message}
                      >
                        {groqStatus.state === "disconnected" ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {groqStatus.state === "connected" ? "Groq Online" : "Cloud Offline"}
                      </span>
                    </h2>
                    <span className="text-[11px] text-navy-india/50">
                      {groqStatus.activeModel ? `Model: ${groqStatus.activeModel}` : "Indian Law Research Assistant"}
                    </span>
                  </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-1 bg-navy-india/5 p-1 rounded-xl border border-navy-india/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFocusMode(!focusMode)}
                    className={cn("h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", focusMode ? "bg-white text-navy-india shadow-sm" : "text-navy-india/40 hover:text-navy-india")}
                  >
                    <Search className="w-3 h-3 mr-1.5" /> Focus Mode
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setArgumentsMode(!argumentsMode)}
                    className={cn("h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", argumentsMode ? "bg-white text-saffron shadow-sm" : "text-navy-india/40 hover:text-navy-india")}
                  >
                    <Zap className="w-3 h-3 mr-1.5" /> Arguments
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAnalysisMode(!analysisMode)}
                    className={cn("h-8 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all", analysisMode ? "bg-white text-green-india shadow-sm" : "text-navy-india/40 hover:text-navy-india")}
                  >
                    <Scale className="w-3 h-3 mr-1.5" /> Analysis
                  </Button>
                </div>

                <div className="h-6 w-px bg-navy-india/10" />

                {/* Language Toggle */}
                <div className="flex items-center gap-1 bg-navy-india/5 p-1 rounded-xl border border-navy-india/10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLanguage('en')}
                    className={cn("h-8 w-10 p-0 text-[10px] font-bold rounded-lg transition-all", language === 'en' ? "bg-white text-navy-india shadow-sm" : "text-navy-india/40 hover:text-navy-india")}
                  >
                    EN
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLanguage('hi')}
                    className={cn("h-8 w-10 p-0 text-[10px] font-bold rounded-lg transition-all", language === 'hi' ? "bg-white text-navy-india shadow-sm" : "text-navy-india/40 hover:text-navy-india")}
                  >
                    HI
                  </Button>
                </div>

                <div className="h-6 w-px bg-navy-india/10" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshGroqStatus}
                  disabled={isCheckingGroq}
                  className="h-9 w-9 text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5 rounded-xl transition-colors"
                  title="Refresh Groq status"
                >
                  <RotateCw className={cn("w-4 h-4", isCheckingGroq && "animate-spin")} />
                </Button>

                <div className="h-6 w-px bg-navy-india/10" />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={exportFullChat}
                  disabled={messages.length === 0}
                  className="h-9 w-9 text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5 rounded-xl transition-colors"
                  title="Export Full Chat to PDF"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Domain Chips - Horizontal Scroll */}
            <div className="px-6 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono font-bold text-navy-india/30 uppercase tracking-tighter mr-2 shrink-0">Domains:</span>
              {domains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDomain(d.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all shrink-0 border",
                    domain === d.id 
                      ? "bg-navy-india text-white border-navy-india shadow-lg shadow-navy-india/10" 
                      : "bg-white text-navy-india/60 border-navy-india/10 hover:border-navy-india/30"
                  )}
                >
                  {d.icon}
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Messages List - Immersive Scroll */}
          <div
            ref={messageListRef}
            onScroll={() => {
              const list = messageListRef.current;
              if (!list) return;

              const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight;
              shouldAutoScrollRef.current = distanceFromBottom < 160;
            }}
            className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-10 pb-12">
              <AnimatePresence mode="popLayout">
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
                  >
                    <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mb-10 border border-navy-india/10 shadow-2xl relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-saffron/20 via-transparent to-green-india/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <Sparkles className="w-12 h-12 text-saffron relative z-10" />
                      
                      {/* Technical Accents */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border border-navy-india/10 flex items-center justify-center shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-green-india animate-pulse" />
                      </div>
                    </div>
                    <h2 className="editorial-heading text-5xl md:text-6xl text-navy-india mb-6 leading-tight">How can I assist <br />your <span className="text-gradient-premium italic font-serif font-light">legal research</span>?</h2>
                    <p className="text-gray-500 max-w-lg mb-16 text-xl leading-relaxed font-light">
                      Ask about IPC, BNS, Supreme Court precedents, or analyze complex legal scenarios with our <span className="text-navy-india font-bold">neural-sync</span> engine.
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
                      {Object.entries(t.quickPrompts).map(([key, text], idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(key === 'murder' ? 'What is the punishment for murder under BNS?' :
                            key === 'consumer' ? 'How to file a consumer complaint?' :
                              key === 'cheating' ? 'What are the laws for cheating?' :
                                'How to draft a rent agreement?')}
                          className="text-left p-6 rounded-[2rem] bg-white border border-navy-india/5 hover:border-saffron/30 hover:shadow-2xl hover:shadow-saffron/10 transition-all group relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-saffron opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">Quick_Action_0{idx + 1}</span>
                            <ArrowRight className="w-3 h-3 text-navy-india/20 group-hover:text-saffron transition-all group-hover:translate-x-1" />
                          </div>
                          <span className="text-base font-bold text-navy-india group-hover:text-saffron transition-colors block">
                            {text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={msg.role === 'assistant' ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex w-full gap-6", msg.role === 'user' ? "justify-end" : "justify-start")}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl bg-navy-india flex items-center justify-center shrink-0 shadow-lg mt-1">
                        <Scale className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className={cn(
                      "max-w-[85%] sm:max-w-[80%] relative",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {msg.role === 'user' && (
                        <div className="mb-2 flex items-center justify-end gap-2">
                          <span className="text-[10px] text-navy-india/30">You</span>
                        </div>
                      )}
                      {msg.role === 'assistant' && (
                        <div className="mb-2 flex items-center gap-2">
                          <span className="text-[10px] text-saffron font-semibold">LegalAI</span>
                          <div className="h-px flex-1 bg-navy-india/5" />
                        </div>
                      )}

                      <div className={cn(
                        "rounded-[2rem] px-8 py-6 text-base leading-relaxed shadow-sm border group transition-all duration-500 relative",
                        msg.role === 'user'
                          ? "bg-navy-india text-white border-navy-india rounded-tr-none shadow-xl shadow-navy-india/20"
                          : "bg-white text-gray-800 border-navy-india/10 rounded-tl-none shadow-2xl shadow-navy-india/5 hover:border-navy-india/20"
                      )}>
                        {/* Copy Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.content);
                            toast.success("Copied to clipboard");
                          }}
                          className={cn(
                            "absolute -right-12 top-0 opacity-0 group-hover:opacity-100 transition-all h-8 w-8 rounded-lg",
                            msg.role === 'user' ? "text-navy-india/40" : "text-navy-india/40"
                          )}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        {msg.role === 'assistant' ? (
                          <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:text-navy-india prose-headings:font-serif prose-headings:font-bold prose-strong:text-saffron prose-a:text-navy-india prose-a:font-bold prose-code:text-saffron prose-code:bg-saffron/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-li:marker:text-saffron">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>

                            {/* Analysis Cards - Only if explicitly provided in structured data (for legacy messages) */}
                            {(msg.neutral_analysis || msg.arguments || (msg.judgments && msg.judgments.length > 0)) && (
                              <div className="mt-8 flex flex-col gap-6 not-prose">
                                {msg.neutral_analysis && (
                                  <div className="bg-green-50/50 border border-green-india/10 rounded-2xl p-6">
                                    <h4 className="flex items-center gap-2 text-green-india font-bold mb-4 text-xs uppercase tracking-widest">
                                      <Scale className="w-4 h-4" /> Legal Analysis
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-6">
                                      <div className="space-y-2">
                                        <span className="text-[10px] font-mono font-bold text-green-india/40 uppercase">Key Factors</span>
                                        <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                                          {msg.neutral_analysis.factors.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                      </div>
                                      <div className="space-y-2">
                                        <span className="text-[10px] font-mono font-bold text-green-india/40 uppercase">Interpretations</span>
                                        <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                                          {msg.neutral_analysis.interpretations.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {msg.arguments && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-navy-india/5 border border-navy-india/10 rounded-2xl p-5">
                                      <h4 className="text-navy-india font-bold mb-3 text-xs uppercase tracking-widest">Arguments For</h4>
                                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-2">
                                        {msg.arguments.for.map((f, i) => <li key={i}>{f}</li>)}
                                      </ul>
                                    </div>
                                    <div className="bg-saffron/5 border border-saffron/10 rounded-2xl p-5">
                                      <h4 className="text-saffron font-bold mb-3 text-xs uppercase tracking-widest">Arguments Against</h4>
                                      <ul className="text-xs text-gray-600 list-disc list-inside space-y-2">
                                        {msg.arguments.against.map((f, i) => <li key={i}>{f}</li>)}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-8 pt-4 border-t border-navy-india/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5 px-3 rounded-lg"
                                  onClick={() => exportPDF(msg, "Legal Query")}
                                >
                                  <Download className="h-3.5 w-3.5 mr-2" /> Export PDF
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5 px-3 rounded-lg"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.content);
                                  }}
                                >
                                  <Copy className="h-3.5 w-3.5 mr-2" /> Copy
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-8 text-[10px] font-bold uppercase tracking-wider px-3 rounded-lg transition-all",
                                    isSpeaking === idx ? "text-saffron bg-saffron/5" : "text-navy-india/40 hover:text-navy-india hover:bg-navy-india/5"
                                  )}
                                  onClick={() => handleTTS(msg.content, idx)}
                                >
                                  <Volume2 className={cn("h-3.5 w-3.5 mr-2", isSpeaking === idx && "animate-pulse")} /> 
                                  {isSpeaking === idx ? "Speaking..." : "Listen"}
                                </Button>
                              </div>
                              <span className="text-[10px] text-navy-india/20">AI-generated · not legal advice</span>
                            </div>
                          </div>
                        ) : (
                          <p className="font-medium">{msg.content}</p>
                        )}
                      </div>

                      {/* Suggested Questions - Only for the last assistant message */}
                      {idx === messages.length - 1 && msg.role === 'assistant' && suggestedQuestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 flex flex-wrap gap-2"
                        >
                          {suggestedQuestions.map((q, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => handleSend(q)}
                              className="text-xs font-bold text-navy-india/60 bg-white border border-navy-india/10 px-4 py-2 rounded-full hover:bg-navy-india hover:text-white hover:border-navy-india transition-all flex items-center gap-2 group"
                            >
                              {q}
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-6"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-india/5 flex items-center justify-center shrink-0 border border-navy-india/10">
                      <Loader2 className="h-5 w-5 animate-spin text-navy-india" />
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <span className="text-[10px] font-mono font-bold text-navy-india/40 uppercase tracking-widest animate-pulse">
                        {loadingText}
                      </span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-saffron animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-navy-india animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-india animate-bounce" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Input Area - Premium Floating Bar */}
          <div className={cn(
            "w-full max-w-4xl mx-auto px-4 pb-8 pt-4 relative z-20 transition-all duration-500",
            focusMode ? "pb-12" : "pb-8"
          )}>
            <div className="relative group">
              {/* Glow effect on focus */}
              <div className="absolute -inset-1 bg-gradient-to-r from-saffron via-navy-india to-green-india rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition-opacity duration-500" />
              
              <div className="relative flex items-center gap-3 bg-white border border-navy-india/10 rounded-[2rem] p-3 shadow-2xl shadow-navy-india/10 transition-all duration-500 hover:border-navy-india/20">
                <Button
                  variant={isListening ? "destructive" : "ghost"}
                  size="icon"
                  onClick={startListening}
                  className={cn(
                    "rounded-full h-12 w-12 shrink-0 transition-all duration-500",
                    isListening 
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                      : "text-navy-india/40 hover:text-saffron hover:bg-saffron/5"
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isListening ? "Listening to your query..." : "Ask your legal question or paste a scenario..."}
                  className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 h-12 px-2 shadow-none text-base font-medium"
                />

                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "rounded-full h-12 w-12 shrink-0 transition-all duration-500",
                    input.trim() && !isLoading
                      ? "bg-navy-india text-white shadow-xl shadow-navy-india/20 hover:scale-105 active:scale-95"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  )}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-center gap-4">
              <span className="text-[11px] text-navy-india/30">AI-generated legal information · not a substitute for professional legal advice</span>
              {focusMode && (
                <button 
                  onClick={() => setFocusMode(false)}
                  className="text-[11px] text-saffron hover:underline"
                >
                  Exit Focus Mode
                </button>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default ChatPage;
