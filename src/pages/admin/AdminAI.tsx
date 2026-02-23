import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai`;

const AdminAI: React.FC = () => {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const isAr = lang === "ar";
  usePageTitle(isAr ? "الذكاء الاصطناعي" : "AI Assistant");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Error", description: errData.error || `Error ${resp.status}` });
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
      toast({ variant: "destructive", title: "Error", description: "Failed to connect" });
    }
    setIsLoading(false);
  };

  const suggestions = isAr
    ? ["ابحث عن شركة روشن وحلل مشاريعها", "ما أفضل مواقع الأراضي حالياً؟", "قارن بين شركات التطوير الكبرى في الرياض", "قيّم جدوى أرض سكنية في جدة"]
    : ["Research ROSHN and analyze their projects", "Best land locations currently?", "Compare major developers in Riyadh", "Evaluate a residential land in Jeddah"];

  // Detect if content is Arabic
  const isArabicContent = (text: string) => /[\u0600-\u06FF]/.test(text.slice(0, 50));

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {isAr ? "المساعد الذكي" : "AI Assistant"}
          </h1>
          <p className="mt-1 text-sm font-light text-muted-foreground">
            {isAr ? "مساعد ذكي للبحث عن الشركات وتحليل الطلبات واتخاذ القرارات" : "AI assistant for company research, request analysis, and decision making"}
          </p>
        </div>

        {/* Chat area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto rounded-xl border border-border/60 bg-card p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="mb-4 h-12 w-12 text-primary/30" />
              <p className="mb-6 text-sm text-muted-foreground">
                {isAr ? "كيف يمكنني مساعدتك اليوم؟" : "How can I help you today?"}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map(s => (
                  <button key={s} onClick={() => { setInput(s); }} className="rounded-lg border border-border/60 bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
                    {s}
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
                    : "bg-surface text-foreground"
                }`}
                dir={msg.role === "assistant" && isArabicContent(msg.content) ? "rtl" : msg.role === "assistant" ? "ltr" : undefined}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-headings:font-medium prose-headings:mb-2 prose-headings:mt-3 prose-p:mb-2 prose-p:leading-relaxed prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5">
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
              <div className="rounded-xl bg-surface px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder={isAr ? "اكتب سؤالك... مثال: ابحث عن شركة دار الأركان" : "Type your question... e.g., Research Dar Al Arkan"}
            className="h-11 rounded-xl"
            disabled={isLoading}
          />
          <Button onClick={send} disabled={isLoading || !input.trim()} className="h-11 w-11 rounded-xl doma-gradient p-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAI;
