import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const ChatPage = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issueInfo, setIssueInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!issueId || !user) return;
    fetchMessages();
    fetchIssueInfo();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${issueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `issue_id=eq.${issueId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [issueId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("issue_id", issueId!)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) || []);
    setLoading(false);
  };

  const fetchIssueInfo = async () => {
    const { data } = await supabase.from("issues").select("*").eq("id", issueId!).single();
    setIssueInfo(data);
  };

  const handleSend = async () => {
    if (!input.trim() || !user || !issueId) return;
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        issue_id: issueId,
        sender_id: user.id,
        content: input.trim(),
      });
      if (error) throw error;
      setInput("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    if (role === "mechanic") navigate("/mechanic-dashboard");
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-sm font-semibold text-foreground">Chat</h1>
          {issueInfo && <p className="text-xs text-muted-foreground">{issueInfo.description?.slice(0, 40)}...</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
        {!loading && messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-10">Start the conversation</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}>
              <p>{msg.content}</p>
              <p className="text-[10px] mt-1 opacity-60">{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t border-border bg-background p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="bg-secondary border-0"
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !input.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ChatPage;
