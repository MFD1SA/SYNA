import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`;

const AI_MODELS = [
  { value: "google/gemini-2.5-pro", label: isAr => isAr ? "النموذج المتقدم" : "Advanced Model", desc: isAr => isAr ? "أقوى وأدق" : "Most powerful", icon: "🧠" },
  { value: "google/gemini-2.5-flash", label: isAr => isAr ? "النموذج السريع" : "Fast Model", desc: isAr => isAr ? "سريع ومتوازن" : "Fast & balanced", icon: "⚡" },
  { value: "openai/gpt-5", label: isAr => isAr ? "التحليل العميق" : "Deep Analysis", desc: isAr => isAr ? "تحليل معمق" : "Deep analysis", icon: "🤖" },
  { value: "openai/gpt-5-mini", label: isAr => isAr ? "النموذج الخفيف" : "Light Model", desc: isAr => isAr ? "سريع وذكي" : "Fast & smart", icon: "💡" },
];

const AdminAI: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "المساعد الذكي" : "AI Assistant");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-pro");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "غير مسجل الدخول" : "Not authenticated" });
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: allMessages, model: selectedModel }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = resp.status === 429
          ? (isAr ? "تم تجاوز حد الطلبات، حاول بعد قليل" : "Rate limit exceeded, try again later")
          : resp.status === 402
            ? (isAr ? "يرجى إضافة رصيد للاستمرار" : "Please add credits to continue")
            : errData.error || `Error ${resp.status}`;
        toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: errMsg });
        setIsLoading(false);
        return;
      }

      if (!resp.body) { setIsLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "فشل الاتصال" : "Failed to connect" });
    }
    setIsLoading(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const suggestions = isAr
    ? [
        "ابحث عن شركة روشن وحلل مشاريعها وقوتها المالية",
        "ما أفضل أحياء الرياض للتطوير السكني حالياً؟",
        "قارن بين دار الأركان وجبل عمر من حيث الشراكة",
        "اكتب تقرير تحليلي عن سوق التطوير العقاري 2024",
        "ما المخاطر المحتملة لأرض تجارية في جدة؟",
        "حلل اتجاهات رؤية 2030 في القطاع العقاري",
      ]
    : [
        "Research ROSHN and analyze their projects and financials",
        "Best Riyadh neighborhoods for residential development?",
        "Compare Dar Al Arkan vs Jabal Omar for partnership",
        "Write an analytical report on RE development market 2024",
        "Potential risks for a commercial land in Jeddah?",
        "Analyze Vision 2030 trends in real estate sector",
      ];

  const isArabicContent = (text: string) => /[\u0600-\u06FF]/.test(text.slice(0, 50));

  const currentModel = AI_MODELS.find(m => m.value === selectedModel);

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              {isAr ? "المساعد الذكي" : "AI Assistant"}
            </h1>
            <p className="mt-1 text-sm font-light text-muted-foreground">
              {isAr
                ? "مدعوم بـ GPT-5 و Gemini Pro — مستشارك الذكي للتطوير العقاري"
                : "Powered by GPT-5 & Gemini Pro — Your smart real estate advisor"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="h-9 w-[180px] rounded-lg border-border/60 bg-card text-xs">
                <SelectValue>
                  <span className="flex items-center gap-1.5">
                    <span>{currentModel?.icon}</span>
                    <span>{currentModel?.label}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    <span className="flex items-center gap-2">
                      <span>{m.icon}</span>
                      <span className="font-medium">{m.label}</span>
                      <span className="text-muted-foreground text-[10px]">— {m.desc}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat} className="h-9 gap-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                {isAr ? "مسح" : "Clear"}
              </Button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-card p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 scale-150 rounded-full bg-primary/5 blur-[40px]" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-card">
                  <Bot className="h-10 w-10 text-primary/40" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                {isAr ? "مرحباً، كيف يمكنني مساعدتك؟" : "Hello, how can I help you?"}
              </h3>
              <p className="mb-6 max-w-md text-sm text-muted-foreground">
                {isAr
                  ? "يمكنني البحث عن شركات التطوير، تحليل الأراضي، تقييم الصفقات، وكتابة التقارير الاحترافية"
                  : "I can research developers, analyze lands, evaluate deals, and write professional reports"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-w-lg">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface p-3 text-start text-xs text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground hover:bg-primary/5"
                  >
                    <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary/50" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface border border-border/40 text-foreground"
                }`}
                dir={msg.role === "assistant" && isArabicContent(msg.content) ? "rtl" : msg.role === "assistant" ? "ltr" : undefined}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-medium prose-headings:mb-2 prose-headings:mt-3 prose-p:mb-2 prose-p:leading-relaxed prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-foreground prose-table:text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-xl bg-surface border border-border/40 px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">{isAr ? "جاري التحليل..." : "Analyzing..."}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={isAr ? "اكتب سؤالك... مثال: ابحث عن شركة دار الأركان وحلل مشاريعها" : "Type your question... e.g., Research Dar Al Arkan and analyze their projects"}
            className="h-11 rounded-xl"
            disabled={isLoading}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} className="h-11 w-11 rounded-xl syna-gradient p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
