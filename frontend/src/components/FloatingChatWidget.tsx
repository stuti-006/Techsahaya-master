import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot,
  Compass,
  FileCheck2,
  Mic,
  MicOff,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  HelpCircle,
  MessageSquareHeart,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useTour } from "../context/TourContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";
import { SUPPORTED_LANGUAGES } from "../utils/languages";
import { cleanTextForSpeech, languageToBCP47, playExclusiveAudio, speakExclusive, stopAllPlayback } from "../utils/speechUtils";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  evidence?: Array<{
    scheme_name: string;
    evidence: string;
    source: string;
    retrieval_score: number;
  }>;
  confidence?: string;
  verificationStatus?: string;
  tourId?: string | null;
  suggestedAction?: {
    type: string;
    tour_id: string;
    title: string;
    description: string;
    route: string;
  } | null;
  audioBase64?: string | null;
  audioMime?: string;
}

const STUCK_HELP_LOCALIZATION: Record<
  string,
  {
    title: string;
    subtitle: string;
    chips: Array<{ label: string; query: string }>;
    cta: string;
  }
> = {
  en: {
    title: "🍉 Stuck or have a question?",
    subtitle: "Need help finding government schemes or checking eligibility? Ask Sahaya!",
    chips: [
      { label: "🌾 Farmer Schemes", query: "What schemes are available for farmers in Karnataka?" },
      { label: "🎓 Scholarships", query: "Tell me about post-matric scholarships for students" },
      { label: "📋 Check Eligibility", query: "How do I check my eligibility for government benefits?" },
      { label: "📄 Document Proofs", query: "What documents do I need to prepare for welfare applications?" },
    ],
    cta: "Ask Sahaya →",
  },
  hi: {
    title: "🍉 क्या आपको सहायता चाहिए?",
    subtitle: "सरकारी योजना खोजने या पात्रता जांचने में अटक गए हैं? मुझसे पूछें!",
    chips: [
      { label: "🌾 किसान योजनाएं", query: "किसानों के लिए कौन सी सरकारी योजनाएं उपलब्ध हैं?" },
      { label: "🎓 छात्रवृत्ति", query: "विद्यार्थियों के लिए छात्रवृत्ति योजनाओं के बारे में बताएं" },
      { label: "📋 पात्रता जांचें", query: "सरकारी लाभों के लिए पात्रता कैसे जांचें?" },
      { label: "📄 जरूरी दस्तावेज", query: "आवेदन के लिए किन दस्तावेजों की आवश्यकता है?" },
    ],
    cta: "सहायता से पूछें →",
  },
  kn: {
    title: "🍉 ಸಹಾಯ ಬೇಕೇ?",
    subtitle: "ಯೋಜನೆ ಹುಡುಕಲು ಅಥವಾ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಲು ಸಿಲುಕಿಕೊಂಡಿದ್ದೀರಾ? ನನ್ನನ್ನು ಕೇಳಿ!",
    chips: [
      { label: "🌾 ರೈತ ಯೋಜನೆಗಳು", query: "ಕರ್ನಾಟಕದ ರೈತರಿಗೆ ಯಾವ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?" },
      { label: "🎓 ವಿದ್ಯಾರ್ಥಿವೇತನ", query: "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ" },
      { label: "📋 ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ", query: "ನನ್ನ ಅರ್ಹತೆಯನ್ನು ಹೇಗೆ ಪರಿಶೀಲಿಸುವುದು?" },
      { label: "📄 ಅಗತ್ಯ ದಾಖಲೆಗಳು", query: "ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?" },
    ],
    cta: "ಸಹಾಯರನ್ನು ಕೇಳಿ →",
  },
  mr: {
    title: "🍉 मदतीची गरज आहे का?",
    subtitle: "सरकारी योजना शोधताना किंवा पात्रता तपासताना अडकला आहात का? मला विचारा!",
    chips: [
      { label: "🌾 शेतकरी योजना", query: "शेतकऱ्यांसाठी कोणत्या शासकीय योजना उपलब्ध आहेत?" },
      { label: "🎓 शिष्यवृत्ती", query: "विद्यार्थ्यांसाठी शिष्यवृत्ती योजनांबद्दल माहिती द्या" },
      { label: "📋 पात्रता तपासा", query: "सरकारी लाभांसाठी माझी पात्रता कशी तपासावी?" },
    ],
    cta: "सहायाला विचारा →",
  },
  te: {
    title: "🍉 సహాయం కావాలా?",
    subtitle: "పథకాలు కనుగొనడంలో లేదా అర్హతను తనిఖీ చేయడంలో ఇబ్బంది పడుతున్నారా? నన్ను అడగండి!",
    chips: [
      { label: "🌾 రైతు పథకాలు", query: "రైతులకు ఏ ప్రభుత్వ పథకాలు అందుబాటులో ఉన్నాయి?" },
      { label: "🎓 స్కాలర్‌షిప్‌లు", query: "విద్యార్థులకు స్కాలర్‌షిప్‌ల గురించి చెప్పండి" },
      { label: "📋 అర్హత తనిಖీ", query: "ప్రభుత్వ పథకాలకు నా అర్హతను ఎలా తనిఖీ చేయాలి?" },
    ],
    cta: "సహాయను అడగండి →",
  },
  ta: {
    title: "🍉 உதவி தேவையா?",
    subtitle: "திட்டங்களைக் கண்டறிவதில் சிக்கல் உள்ளதா? என்னிடம் கேளுங்கள்!",
    chips: [
      { label: "🌾 உழவர் திட்டங்கள்", query: "விவசாயிகளுக்கு என்ன நலத்திட்டங்கள் உள்ளன?" },
      { label: "🎓 கல்வி உதவித்தொகை", query: "மாணவர்களுக்கான கல்வி உதவித்தொகை பற்றி கூறவும்" },
      { label: "📋 தகுதி சரிபார்ப்பு", query: "அரசு திட்டங்களுக்கான எனது தகுதியை எவ்வாறு சரிபார்ப்பது?" },
    ],
    cta: "சஹாயாவிடம் கேளுங்கள் →",
  },
};

function FormattedMessageText({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>;
  }

  const lines = text.split("\n");

  const renderInlineStyles = (str: string) => {
    const parts = str.split(/(\[.*?\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s)]+|\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (!part) return null;

      const mdLinkMatch = part.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
      if (mdLinkMatch) {
        return (
          <a
            key={i}
            href={mdLinkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline font-medium hover:text-emerald-900"
          >
            {mdLinkMatch[1]}
          </a>
        );
      }

      if (/^https?:\/\/[^\s)]+$/.test(part)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 underline break-all font-medium hover:text-emerald-900"
          >
            {part}
          </a>
        );
      }

      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }

      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        return (
          <em key={i} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      }

      return part;
    });
  };

  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-1.5 list-disc pl-5 space-y-1 text-sm text-slate-800">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletContent = trimmed.substring(2);
      currentList.push(
        <li key={index} className="leading-relaxed">
          {renderInlineStyles(bulletContent)}
        </li>
      );
      return;
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      currentList.push(
        <li key={index} className="leading-relaxed list-decimal">
          {renderInlineStyles(numberedMatch[2])}
        </li>
      );
      return;
    }

    flushList();

    if (!trimmed) {
      elements.push(<div key={index} className="h-1.5" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={index} className="mt-2 text-sm font-bold text-slate-900">
          {renderInlineStyles(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={index} className="mt-2.5 text-base font-bold text-slate-900">
          {renderInlineStyles(trimmed.substring(3))}
        </h3>
      );
    } else {
      elements.push(
        <p key={index} className="text-sm leading-relaxed text-slate-800 my-0.5">
          {renderInlineStyles(line)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

export function FloatingChatWidget() {
  const { language, setLanguage, user, profile } = useAppContext();
  const { startTour } = useTour();

  const [isOpen, setIsOpen] = useState(false);
  const [showStuckPrompt, setShowStuckPrompt] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Namaste! I am Sahaya, your citizen welfare assistant. Ask me anything about government schemes, eligibility criteria, or document preparation in any of the 9 supported Indian languages.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Still cursor / idle detection for proactive assistance
  useEffect(() => {
    if (isOpen || snoozed || user?.role === "admin") {
      setShowStuckPrompt(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      // Trigger when cursor or user interaction is paused for 5 seconds
      idleTimerRef.current = setTimeout(() => {
        setShowStuckPrompt(true);
      }, 5000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("scroll", resetTimer, { passive: true });
    window.addEventListener("touchstart", resetTimer, { passive: true });

    resetTimer();

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [isOpen, snoozed, user?.role]);

  useEffect(() => {
    return () => {
      stopAllPlayback();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    // Ensure chat opens if triggered from stuck popup
    setIsOpen(true);
    setShowStuckPrompt(false);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const res = await api.post("/api/chat", {
        message: query,
        language: language || "en",
      });

      const data = res.data;
      const assistantMessage: Message = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: data.evidence,
        confidence: data.confidence,
        verificationStatus: data.verification_status,
        tourId: data.tour_id,
        suggestedAction: data.suggested_action,
        audioBase64: data.audio_base64,
        audioMime: data.audio_mime || "audio/wav",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      playAudio(assistantMessage.id, data.audio_base64, data.audio_mime || "audio/wav", data.answer);
    } catch (err: any) {
      const isRateLimit = err?.response?.status === 429;
      const retryAfter = err?.response?.headers?.["retry-after"] || "a few";
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: isRateLimit
          ? `You have sent too many requests. Please wait ${retryAfter} seconds before asking again.`
          : "I am having trouble connecting to the Sahaya service right now. Please try again or browse schemes from the navigation menu.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert(t(language, "voiceUnavailable"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleVoiceUpload(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Microphone access failed", err);
      alert(t(language, "voiceUnavailable"));
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleVoiceUpload = async (audioBlob: Blob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "voice_query.webm");
    formData.append("language", language || "en");
    formData.append("profile", JSON.stringify(profile));

    try {
      const response = await api.post("/api/voice-chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = response.data;
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: data.transcript || "Voice input",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const asstData = data.response;
      const asstMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: asstData?.answer || "I received your voice message.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        evidence: asstData?.evidence,
        confidence: asstData?.confidence,
        verificationStatus: asstData?.verification_status,
        tourId: asstData?.tour_id,
        suggestedAction: asstData?.suggested_action,
        audioBase64: asstData?.audio_base64,
        audioMime: asstData?.audio_mime || "audio/wav",
      };

      setMessages((prev) => [...prev, userMsg, asstMsg]);

      playAudio(asstMsg.id, asstData?.audio_base64, asstData?.audio_mime || "audio/wav", asstData?.answer);
    } catch (err) {
      console.error("Voice chat upload failed", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        text: "Sorry, I could not process your voice message. Please try speaking clearly or type your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (msgId: string, base64Audio?: string | null, mime: string = "audio/wav", textFallback?: string) => {
    if (playingAudioId === msgId) {
      stopAllPlayback();
      setPlayingAudioId(null);
      return;
    }

    if (base64Audio) {
      const audio = new Audio(`data:${mime};base64,${base64Audio}`);
      playExclusiveAudio(
        audio,
        () => setPlayingAudioId(msgId),
        () => setPlayingAudioId(null),
        () => setPlayingAudioId(null)
      ).catch(() => setPlayingAudioId(null));
    } else if ("speechSynthesis" in window && textFallback) {
      const speechText = cleanTextForSpeech(textFallback);
      if (speechText) {
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = languageToBCP47(language || "en");
        speakExclusive(
          utterance,
          () => setPlayingAudioId(msgId),
          () => setPlayingAudioId(null),
          () => setPlayingAudioId(null)
        );
      }
    }
  };

  const triggerTour = (tourId: string) => {
    const success = startTour(tourId);
    if (success) {
      setIsOpen(false);
    }
  };

  if (user?.role === "admin") return null;

  const currentHelp = STUCK_HELP_LOCALIZATION[language] || STUCK_HELP_LOCALIZATION.en;

  return (
    <>
      {/* 🍉 Watermelon UI Proactive Still-Cursor Speech Bubble Popup */}
      <AnimatePresence>
        {showStuckPrompt && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 26 }}
            className="fixed bottom-24 right-4 sm:right-6 z-[65] w-[calc(100vw-2rem)] sm:w-88 max-w-sm"
          >
            <div className="relative rounded-3xl border-2 border-[#164E35] bg-[#FAFDFB] p-4 shadow-2xl shadow-[#E8254E]/20 overflow-hidden">
              {/* Top Watermelon Rind Banner Strip */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#164E35] via-[#205C3B] to-[#10B981]" />

              {/* Header with juicy Watermelon Badge & Dismiss */}
              <div className="mt-1 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4365] to-[#E8254E] text-white shadow-sm text-base">
                    🍉
                  </span>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#164E35]">
                      {currentHelp.title}
                    </h4>
                    <p className="text-xs text-slate-600 leading-snug mt-0.5">
                      {currentHelp.subtitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowStuckPrompt(false);
                    setSnoozed(true);
                    setTimeout(() => setSnoozed(false), 90000); // Snooze for 90s
                  }}
                  className="rounded-full p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                  aria-label="Dismiss helper"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Quick Suggestion Chips */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {currentHelp.chips.slice(0, 3).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip.query)}
                    className="rounded-full border border-[#10B981]/40 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-[#FF4365] hover:bg-rose-50 hover:text-[#C9183C] transition cursor-pointer shadow-xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* CTA launch bar */}
              <div className="mt-3.5 flex items-center justify-between pt-2 border-t border-emerald-100">
                <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Instant AI Verified Response
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    setShowStuckPrompt(false);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#FF4365] to-[#E8254E] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:from-[#E8254E] hover:to-[#C9183C] transition cursor-pointer"
                >
                  {currentHelp.cta}
                </button>
              </div>

              {/* Speech Bubble Pointer Tail */}
              <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b-2 border-r-2 border-[#164E35] bg-[#FAFDFB]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🍉 Floating Launcher Action Button (Watermelon UI theme) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-[60]">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setShowStuckPrompt(false);
            }}
            data-tour="floating-chat-btn"
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF4365] via-[#E8254E] to-[#C9183C] text-white shadow-2xl shadow-[#E8254E]/40 border-2 border-[#164E35] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            aria-label="Open welfare assistant"
          >
            {/* Ambient Watermelon Glow Halo */}
            <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-75 blur-sm bg-gradient-to-r from-[#FF4365] to-[#10B981] animate-pulse" />

            <div className="relative z-10 flex items-center justify-center">
              <Bot size={26} className="text-white drop-shadow-sm transition group-hover:rotate-6" />
            </div>

            {/* Online Live Indicator */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75 animate-ping" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-[#10B981] border-2 border-white shadow-xs" />
            </span>
          </button>
        </div>
      )}

      {/* 🍉 Responsive Chat Window Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Tech Sahaya Assistant"
          className="fixed bottom-4 right-2 sm:bottom-6 sm:right-6 z-[70] flex flex-col h-[90vh] sm:h-[600px] w-[calc(100vw-1rem)] sm:w-[420px] max-w-full rounded-3xl border-2 border-[#164E35] bg-white shadow-2xl shadow-slate-900/25 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header with Watermelon Theme */}
          <div className="flex items-center justify-between border-b border-[#164E35]/20 bg-gradient-to-r from-[#164E35] via-[#1F5F3A] to-[#164E35] p-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4365] to-[#E8254E] text-white shadow-sm">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm leading-tight text-white">
                  <span>Tech Sahaya</span>
                  <span className="rounded-full bg-[#FF4365] px-1.5 py-0.2 text-[9px] font-bold text-white tracking-wider">
                    AI
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>DPDP Verified • {language.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                aria-label="Select chat language"
                className="h-8 rounded-lg border border-emerald-700 bg-emerald-900/60 px-2 text-xs font-semibold text-white focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                    {lang.nativeLabel} ({lang.label})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-200 hover:bg-emerald-800 hover:text-white transition"
                aria-label="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFDFB]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-xs ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-[#164E35] to-[#1F5F3A] text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <FormattedMessageText text={msg.text} isUser={msg.sender === "user"} />

                  {/* Audio Readout Control */}
                  {msg.sender === "assistant" && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => playAudio(msg.id, msg.audioBase64, msg.audioMime, msg.text)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          playingAudioId === msg.id
                            ? "bg-rose-100 text-rose-800 border border-rose-300 animate-pulse"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        }`}
                      >
                        {playingAudioId === msg.id ? (
                          <>
                            <Square size={12} fill="currentColor" /> {t(language, "stopAudio")}
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} /> {t(language, "playVoice")}
                          </>
                        )}
                      </button>

                      {msg.verificationStatus && (
                        <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <FileCheck2 size={12} /> Verified
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Tour Suggested Action */}
                {msg.suggestedAction && msg.suggestedAction.tour_id && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerTour(msg.suggestedAction!.tour_id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 transition animate-bounce cursor-pointer"
                    >
                      <Compass size={14} className="text-emerald-600" />
                      {msg.suggestedAction.title}
                    </button>
                  </div>
                )}

                <span className="mt-1 text-[10px] text-slate-400 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border w-fit">
                <span className="flex h-2 w-2 rounded-full bg-[#FF4365] animate-ping" />
                {t(language, "retrievingEvidence")}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Suggestions */}
          <div className="px-3 py-2 bg-stone-100/80 border-t border-stone-200 flex gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => handleSend(t(language, "farmerSchemesQuery"))}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-slate-600 hover:bg-rose-50 hover:text-[#C9183C] hover:border-[#FF4365] border border-slate-200 transition cursor-pointer"
            >
              {t(language, "farmerSchemesChip")}
            </button>
            <button
              type="button"
              onClick={() => handleSend(t(language, "uploadDocsQuery"))}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-slate-600 hover:bg-rose-50 hover:text-[#C9183C] hover:border-[#FF4365] border border-slate-200 transition cursor-pointer"
            >
              {t(language, "uploadDocsChip")}
            </button>
            <button
              type="button"
              onClick={() => handleSend(t(language, "missedBenefitsQuery"))}
              className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-slate-600 hover:bg-rose-50 hover:text-[#C9183C] hover:border-[#FF4365] border border-slate-200 transition cursor-pointer"
            >
              {t(language, "missedBenefitsChip")}
            </button>
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-white border-t border-stone-200">
            {recording ? (
              <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 rounded-2xl p-2.5">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-ping" />
                  {t(language, "listeningPrompt")} {language.toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="rounded-xl bg-[#E8254E] px-3.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-[#C9183C] cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-slate-600 hover:bg-rose-50 hover:text-[#C9183C] hover:border-[#FF4365] transition cursor-pointer"
                  title="Speak query (Sarvam AI Voice)"
                  aria-label="Record voice query"
                >
                  <Mic size={18} />
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    language === "hi"
                      ? "योजनाओं के बारे में पूछें..."
                      : language === "kn"
                      ? "ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಿ..."
                      : "Ask about schemes, eligibility, documents..."
                  }
                  className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm focus:border-[#E8254E] focus:outline-none"
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF4365] to-[#E8254E] text-white shadow-sm hover:from-[#E8254E] hover:to-[#C9183C] disabled:opacity-40 transition cursor-pointer"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
