import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Mic, X, Send, Loader2, Volume2, MicOff, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mechanicWalkGif from "@/assets/mechanic_walk.gif";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CharacterState = "walking" | "focused" | "chatting" | "listening" | "responding";

interface AIMechanicCharacterProps {
  profile: any;
  vehicles: any[];
}

const AIMechanicCharacter = ({ profile, vehicles }: AIMechanicCharacterProps) => {
  const [state, setState] = useState<CharacterState>("walking");
  const [position, setPosition] = useState(20);
  const [direction, setDirection] = useState<"right" | "left">("right");
  const [showBubble, setShowBubble] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef(window.speechSynthesis);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>();

  // Walking animation
  useEffect(() => {
    if (state !== "walking") {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let pos = position;
    let dir = direction;
    const speed = 0.3;

    const animate = () => {
      const container = containerRef.current;
      if (!container) return;
      const maxPos = container.offsetWidth - 100;

      if (dir === "right") {
        pos += speed;
        if (pos >= maxPos) { dir = "left"; setDirection("left"); }
      } else {
        pos -= speed;
        if (pos <= 10) { dir = "right"; setDirection("right"); }
      }
      setPosition(pos);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [state]);

  // Idle hint timer
  useEffect(() => {
    if (state === "walking") {
      const timer = setTimeout(() => setShowHint(true), 12000);
      setIdleTimer(timer);
      return () => clearTimeout(timer);
    } else {
      setShowHint(false);
      if (idleTimer) clearTimeout(idleTimer);
    }
  }, [state]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingText]);

  const handleCharacterClick = () => {
    if (state === "walking") {
      setState("focused");
      setShowBubble(true);
      setShowHint(false);
    }
  };

  const handleClose = () => {
    setState("walking");
    setShowBubble(false);
    setChatMessages([]);
    setChatInput("");
    setTypingText("");
    synthRef.current.cancel();
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // Typing animation effect
  const animateTyping = useCallback((text: string, onDone: () => void) => {
    let i = 0;
    setTypingText("");
    const interval = setInterval(() => {
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        onDone();
      }
    }, 18);
    return () => clearInterval(interval);
  }, []);

  // Text Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user" as const, content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setState("responding");

    const vehicleInfo = vehicles.map((v: any) => `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`).join(", ");

    try {
      const res = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: newMessages,
          userContext: { area: profile?.area, vehicles: vehicleInfo },
        },
      });

      if (res.error) throw res.error;

      // Handle streaming response
      const reader = res.data?.getReader?.();
      if (reader) {
        let fullText = "";
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            const jsonStr = line.replace("data: ", "");
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content || "";
              fullText += delta;
              setTypingText(fullText.replace(/\*+/g, ""));
            } catch {}
          }
        }
        const cleanText = fullText.replace(/\*+/g, "");
        setChatMessages(prev => [...prev, { role: "assistant", content: cleanText }]);
        setTypingText("");
      } else {
        const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        setChatMessages(prev => [...prev, { role: "assistant", content: text.replace(/\*+/g, "") }]);
      }
    } catch (e: any) {
      toast.error(e.message || "AI error");
    } finally {
      setChatLoading(false);
      setState("chatting");
    }
  };

  // Voice
  const speak = useCallback((text: string) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.lang = "en-IN";
    setIsSpeaking(true);
    setState("responding");
    utterance.onend = () => { setIsSpeaking(false); setState("chatting"); };
    utterance.onerror = () => { setIsSpeaking(false); setState("chatting"); };
    synthRef.current.speak(utterance);
  }, []);

  const sendVoiceToAI = useCallback(async (userText: string) => {
    const userMsg = { role: "user" as const, content: userText };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setIsProcessing(true);
    setState("responding");

    const vehicleInfo = vehicles.map((v: any) => `${v.vehicle_type} ${v.vehicle_brand || ""} ${v.vehicle_model || ""}`).join(", ");

    try {
      const { data, error } = await supabase.functions.invoke("ai-voice-mechanic", {
        body: { messages: newMessages, userContext: { area: profile?.area, vehicles: vehicleInfo } },
      });
      if (error) throw error;
      const reply = data?.reply || "Sorry, please try again.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      speak(reply);
    } catch (e: any) {
      toast.error(e.message || "Voice AI error");
      setState("chatting");
    } finally {
      setIsProcessing(false);
    }
  }, [chatMessages, profile, vehicles, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Speech recognition not supported. Use Chrome."); return; }

    synthRef.current.cancel();
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => { setIsListening(true); setState("listening"); };
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
      if (result.isFinal) {
        const finalText = result[0].transcript;
        setTranscript("");
        sendVoiceToAI(finalText);
      }
    };
    recognition.onerror = (e: any) => {
      setIsListening(false);
      setState("chatting");
      if (e.error !== "aborted") toast.error("Could not hear you. Try again.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  }, [sendVoiceToAI]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const selectMode = (mode: "chat" | "voice") => {
    setState("chatting");
    setShowBubble(false);
    if (mode === "voice") {
      startListening();
    }
  };

  const isInteracting = state === "chatting" || state === "listening" || state === "responding";

  return (
    <div ref={containerRef} className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none" style={{ height: "140px" }}>
      {/* Idle hint */}
      {showHint && state === "walking" && (
        <div
          className="absolute pointer-events-auto animate-fade-in"
          style={{ left: `${position}px`, bottom: "110px", transform: "translateX(-20px)" }}
        >
          <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg relative max-w-[200px]">
            <p className="text-xs text-foreground font-medium">Need help with your vehicle?</p>
            <div className="flex gap-1 mt-1.5">
              <Button size="sm" variant="default" className="text-[10px] h-6 px-2 pointer-events-auto" onClick={() => { setShowHint(false); handleCharacterClick(); }}>
                Yes!
              </Button>
              <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 pointer-events-auto" onClick={() => setShowHint(false)}>
                Later
              </Button>
            </div>
            <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-card border-r border-b border-border rotate-45" />
          </div>
        </div>
      )}

      {/* Choice bubble */}
      {showBubble && state === "focused" && (
        <div
          className="absolute pointer-events-auto animate-fade-in"
          style={{ left: `${Math.min(Math.max(position, 30), (containerRef.current?.offsetWidth || 300) - 220)}px`, bottom: "115px" }}
        >
          <div className="bg-card border border-primary/30 rounded-xl p-3 shadow-lg glow-primary relative min-w-[200px]">
            <button onClick={handleClose} className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-sm text-foreground font-medium mb-2.5 pr-4">Do you want to talk with AI Mechanic?</p>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" className="w-full justify-start text-xs h-8" onClick={() => selectMode("chat")}>
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Text Chat
              </Button>
              <Button size="sm" variant="outline" className="w-full justify-start text-xs h-8" onClick={() => selectMode("voice")}>
                <Mic className="h-3.5 w-3.5 mr-1.5" /> Voice Assistant
              </Button>
            </div>
            <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-card border-r border-b border-primary/30 rotate-45" />
          </div>
        </div>
      )}

      {/* Chat/Voice panel */}
      {isInteracting && (
        <div className="fixed bottom-0 right-0 z-50 pointer-events-auto w-full sm:w-[380px] sm:right-4 sm:bottom-4 animate-slide-up">
          <div className="bg-card border border-border rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "70vh" }}>
            {/* Header */}
            <div className="p-3 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-2">
                <img src={mechanicWalkGif} alt="AI Mechanic" className="h-8 w-8 rounded-full object-cover bg-muted" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">AI Mechanic</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {state === "listening" ? "Listening..." : state === "responding" ? "Thinking..." : "Online"}
                  </p>
                </div>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5" style={{ minHeight: "200px", maxHeight: "45vh" }}>
              {chatMessages.length === 0 && !typingText && (
                <div className="text-center text-muted-foreground text-xs py-6">
                  <Bot className="h-8 w-8 mx-auto mb-2 text-primary/40" />
                  <p>Describe your vehicle issue and I'll help diagnose it!</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {msg.role === "assistant" && (
                    <img src={mechanicWalkGif} alt="" className="h-6 w-6 rounded-full object-cover bg-muted shrink-0 mt-1" />
                  )}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {typingText && (
                <div className="flex justify-start gap-2">
                  <img src={mechanicWalkGif} alt="" className="h-6 w-6 rounded-full object-cover bg-muted shrink-0 mt-1" />
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-xs bg-secondary text-foreground">
                    {typingText}<span className="animate-pulse">|</span>
                  </div>
                </div>
              )}
              {(chatLoading && !typingText) && (
                <div className="flex justify-start gap-2">
                  <img src={mechanicWalkGif} alt="" className="h-6 w-6 rounded-full object-cover bg-muted shrink-0 mt-1" />
                  <div className="bg-secondary rounded-xl px-3 py-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              {transcript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-xl px-3 py-2 text-xs bg-primary/30 text-foreground italic">
                    {transcript}...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="p-2.5 border-t border-border flex items-center gap-2">
              {isSpeaking && (
                <p className="text-[10px] text-primary animate-pulse flex items-center gap-1 absolute -top-6 left-3">
                  <Volume2 className="h-3 w-3" /> Speaking...
                </p>
              )}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || chatLoading}
                className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-secondary text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                placeholder="Type your issue..."
                className="bg-secondary border-0 h-9 text-xs"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Character */}
      <div
        className={`absolute bottom-2 pointer-events-auto cursor-pointer transition-transform duration-200 ${
          state === "focused" ? "scale-125" : isInteracting ? "scale-100" : "hover:scale-110"
        }`}
        style={{
          left: isInteracting ? "16px" : `${position}px`,
          transition: isInteracting ? "left 0.5s ease-in-out" : undefined,
        }}
        onClick={state === "walking" ? handleCharacterClick : undefined}
      >
        <div className="relative">
          {/* Shadow */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-16 h-3 bg-foreground/10 rounded-full blur-sm" />
          {/* Character image */}
          <img
            src={mechanicWalkGif}
            alt="AI Mechanic"
            className={`h-20 w-auto drop-shadow-lg ${
              state === "walking"
                ? "animate-[bounce_0.6s_ease-in-out_infinite]"
                : state === "responding"
                ? "animate-pulse"
                : state === "listening"
                ? "animate-pulse-glow rounded-full"
                : ""
            }`}
            style={{
              transform: direction === "left" ? "scaleX(-1)" : "scaleX(1)",
              animationDuration: state === "walking" ? "0.6s" : undefined,
            }}
          />
          {/* Glow when listening */}
          {state === "listening" && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
};

export default AIMechanicCharacter;
