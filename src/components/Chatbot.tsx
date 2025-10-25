// src/components/Chatbot.tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Mic, Globe, Bot, User, ImagePlus, Volume2, Square } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import ReactMarkdown from "react-markdown";

const BACKEND_URL = "http://localhost:5000/api/gemini";

const quickSuggestions: Record<string, string[]> = {
  en: [
    "Should I irrigate today?",
    "What's the wheat price forecast?",
    "How to treat aphid infestation?",
    "Weather forecast this week",
  ],
  hi: [
    "क्या आज सिंचाई करनी चाहिए?",
    "गेहूं की कीमत का पूर्वानुमान क्या है?",
    "एफिड संक्रमण का इलाज कैसे करें?",
    "इस सप्ताह मौसम का पूर्वानुमान",
  ],
  ta: [
    "இன்று நீர்ப்பாசனம் செய்ய வேண்டுமா?",
    "கோதுமை விலை முன்னறிவிப்பு என்ன?",
    "அசுவினி தொற்றுக்கு சிகிச்சை எப்படி?",
    "இந்த வாரம் வானிலை முன்னறிவிப்பு",
  ],
  te: [
    "ఈరోజు నీటిపారుదల చేయాలా?",
    "గోధుమ ధర అంచనా ఏమిటి?",
    "ఎఫిడ్ సంక్రమణకు చికిత్స ఎలా?",
    "ఈ వారం వాతావరణ అంచనా",
  ],
  bn: [
    "আজ সেচ দেওয়া উচিত?",
    "গমের দামের পূর্বাভাস কী?",
    "এফিড সংক্রমণের চিকিৎসা কীভাবে করবেন?",
    "এই সপ্তাহের আবহাওয়ার পূর্বাভাস",
  ],
  kn: [
    "ಇಂದು ನೀರಾವರಿ ಮಾಡಬೇಕೇ?",
    "ಗೋಧಿ ಬೆಲೆ ಮುನ್ಸೂಚನೆ ಏನು?",
    "ಎಫಿಡ್ ಸೋಂಕಿಗೆ ಚಿಕಿತ್ಸೆ ಹೇಗೆ?",
    "ಈ ವಾರದ ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
  ],
};

const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi (हिंदी)",
  ta: "Tamil (தமிழ்)",
  te: "Telugu (తెలుగు)",
  bn: "Bengali (বাংলা)",
  kn: "Kannada (ಕನ್ನಡ)",
};

const initialMessages: Record<string, Message> = {
  en: {
    id: 1,
    role: "bot",
    content: "Namaste! I'm your AgriSure AI assistant. How can I help you today?",
    timestamp: new Date(),
  },
  hi: {
    id: 1,
    role: "bot",
    content: "नमस्ते! मैं आपका AgriSure AI सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?",
    timestamp: new Date(),
  },
  ta: {
    id: 1,
    role: "bot",
    content: "வணக்கம்! நான் உங்கள் AgriSure AI உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
    timestamp: new Date(),
  },
  te: {
    id: 1,
    role: "bot",
    content: "నమస్తే! నేను మీ AgriSure AI సహాయకుడిని. ఈ రోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    timestamp: new Date(),
  },
  bn: {
    id: 1,
    role: "bot",
    content: "নমস্কার! আমি আপনার AgriSure AI সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    timestamp: new Date(),
  },
  kn: {
    id: 1,
    role: "bot",
    content: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ AgriSure AI ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    timestamp: new Date(),
  },
};

type Message = {
  id: number;
  role: "user" | "bot";
  content?: string;
  timestamp?: Date;
  imageUrl?: string;
};

export function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([initialMessages.en]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
 // const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition with better error handling
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    // Language mapping for speech recognition
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      bn: 'bn-IN',
      kn: 'kn-IN',
    };

    recognitionRef.current.lang = langMap[language] || 'en-IN';

    recognitionRef.current.onstart = () => {
      console.log("Speech recognition started");
      setIsRecording(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      setInput(transcript);
      setIsRecording(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      alert(`Speech recognition error: ${event.error}. Please try again.`);
      setIsRecording(false);
    };

    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended");
      setIsRecording(false);
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  // Handle language change
  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setMessages([initialMessages[newLang as keyof typeof initialMessages]]);

    // Update speech recognition language
    if (recognitionRef.current) {
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        bn: 'bn-IN',
        kn: 'kn-IN',
      };
      recognitionRef.current.lang = langMap[newLang] || 'en-IN';
    }
  };

  const getLanguageInstructions = (lang: string): string => {
    const instructions: Record<string, string> = {
      en: "Answer ONLY in English language. Keep response under 100 words.",
      hi: "जवाब केवल हिंदी भाषा में दें। अंग्रेजी शब्द बिल्कुल नहीं। 100 शब्दों से कम रखें।",
      ta: "பதில் தமிழ் மொழியில் மட்டுமே கொடுங்கள். ஆங்கிலம் வேண்டாம். 100 வார்த்தைகளுக்குள் வைக்கவும்.",
      te: "సమాధానం తెలుగు భాషలో మాత్రమే ఇవ్వండి. ఇంగ్లీష్ వద్దు. 100 పదాలలోపు ఉంచండి.",
      bn: "শুধুমাত্র বাংলা ভাষায় উত্তর দিন। ইংরেজি নয়। ১০০ শব্দের মধ্যে রাখুন।",
      kn: "ಉತ್ತರವನ್ನು ಕನ್ನಡ ಭಾಷೆಯಲ್ಲಿ ಮಾತ್ರ ನೀಡಿ। ಇಂಗ್ಲಿಷ್ ಬೇಡ. 100 ಪದಗಳಲ್ಲಿ ಇರಿಸಿ.",
    };
    return instructions[lang] || instructions.en;
  };

  const PROFESSIONAL_FARMER_PROMPT = `You are a professional Indian agricultural advisor. Give precise, actionable answers in 3-5 short sentences maximum.

CRITICAL LANGUAGE REQUIREMENTS:
${getLanguageInstructions(language)}

Be direct and concise. Use bullet points only when listing steps. No lengthy explanations.`;

  const pushMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  async function sendToBackend(userText: string, file?: File | null) {
    setIsTyping(true);
    try {
      const promptText = `${PROFESSIONAL_FARMER_PROMPT}\n\nQuestion: ${userText}`;

      const fd = new FormData();
      fd.append("prompt", promptText);
      fd.append("language", language);

      if (file) {
        fd.append("file", file);
      }

      const resp = await fetch(BACKEND_URL, {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server returned ${resp.status}: ${text}`);
      }

      const data = await resp.json();
      pushMessage({
        id: messages.length + 2,
        role: "bot",
        content: data.answer || "Sorry, I couldn't get an answer.",
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Backend error:", err);
      pushMessage({
        id: messages.length + 2,
        role: "bot",
        content: "Sorry — something went wrong contacting the backend.",
        timestamp: new Date(),
      });
    } finally {
      setIsTyping(false);
      setAttachedFile(null);
      setAttachedPreview(null);
    }
  }

  const handleSend = (text?: string) => {
    const messageText = text ?? input;
    if (!messageText.trim() && !attachedFile) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: messageText,
      timestamp: new Date(),
      imageUrl: attachedPreview ?? undefined,
    };

    pushMessage(userMessage);
    setInput("");
    sendToBackend(messageText, attachedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAttachedFile(f);
    const reader = new FileReader();
    reader.onload = () => setAttachedPreview(String(reader.result));
    reader.readAsDataURL(f);
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleVoiceRecord = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Error stopping recognition:", e);
        setIsRecording(false);
      }
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Error starting recognition:", e);
        alert("Could not start speech recognition. Please try again.");
      }
    }
  };

  const handleTextToSpeech = (messageId: number, text: string) => {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    if (speakingMessageId === messageId) {
      setSpeakingMessageId(null);
      return;
    }

    // Wait for voices to load
    const speak = () => {
      const voices = window.speechSynthesis.getVoices();

      // Language-specific voice selection
      const voiceMap: Record<string, string[]> = {
        en: ['en-IN', 'en_IN', 'English (India)'],
        hi: ['hi-IN', 'hi_IN', 'Hindi'],
        ta: ['ta-IN', 'ta_IN', 'Tamil'],
        te: ['te-IN', 'te_IN', 'Telugu'],
        bn: ['bn-IN', 'bn_IN', 'Bengali'],
        kn: ['kn-IN', 'kn_IN', 'Kannada'],
      };

      const preferredVoices = voiceMap[language] || voiceMap.en;
      let selectedVoice = voices.find(voice =>
        preferredVoices.some(pv => voice.lang.includes(pv) || voice.name.includes(pv))
      );

      // Fallback to any voice with the language code
      if (!selectedVoice) {
        const langCode = language === 'en' ? 'en' : language;
        selectedVoice = voices.find(voice => voice.lang.startsWith(langCode));
      }

      const utterance = new SpeechSynthesisUtterance(text);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.lang = language === 'en' ? 'en-IN' : `${language}-IN`;
      utterance.rate = 0.85;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        setSpeakingMessageId(null);
      };

      utterance.onerror = (e) => {
        console.error("TTS error:", e);
        setSpeakingMessageId(null);
      };

      setSpeakingMessageId(messageId);
      window.speechSynthesis.speak(utterance);
    };

    // Ensure voices are loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        speak();
      };
    } else {
      speak();
    }
  };

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Bot className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="font-medium text-foreground">AI Assistant</h1>
              <motion.p
                className="text-xs text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {languageNames[language]}
              </motion.p>
            </div>
          </div>

          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
              <SelectItem value="ta">தமிழ்</SelectItem>
              <SelectItem value="te">తెలుగు</SelectItem>
              <SelectItem value="bn">বাংলা</SelectItem>
              <SelectItem value="kn">ಕನ್ನಡ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Quick Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-[72px] left-0 right-0 z-30 bg-white border-b border-gray-200 p-3"
      >
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(quickSuggestions[language] || quickSuggestions.en).map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="whitespace-nowrap text-xs"
                onClick={() => handleSend(suggestion)}
              >
                {suggestion}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Chat Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 space-y-4 pt-[135px] pb-[120px] z-10"
        style={{ scrollBehavior: "smooth" }}
      >
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex gap-2 max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user" ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Bot className="w-5 h-5 text-gray-700" />
                  )}
                </div>
                <div className="flex-1">
                  <Card
                    className={`p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-white"
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="attachment"
                        className="mb-2 max-h-48 rounded object-contain"
                      />
                    )}
                    {message.role === "bot" ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{message.content || ""}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                  </Card>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <p className="text-[10px] text-muted-foreground">
                      {message.timestamp?.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.role === "bot" && message.content && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => handleTextToSpeech(message.id, message.content || "")}
                      >
                        {speakingMessageId === message.id ? (
                          <Square className="w-3 h-3" />
                        ) : (
                          <Volume2 className="w-3 h-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-700" />
            </div>
            <Card className="p-3 bg-white">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-[64px] left-0 right-0 z-40 bg-white border-t border-gray-200 p-3"
      >
        <div className="flex items-end gap-2 max-w-md mx-auto">
          <Button variant="outline" size="icon" onClick={handleAttachClick}>
            <ImagePlus className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            {attachedPreview && (
              <div className="mb-2 relative">
                <img
                  src={attachedPreview}
                  alt="preview"
                  className="max-h-28 rounded"
                />
                <button
                  onClick={handleRemoveAttachment}
                  className="absolute top-0 right-0 bg-white rounded-full px-1 shadow"
                >
                  ×
                </button>
              </div>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isRecording ? "🎤 Listening..." : "Ask me anything..."}
              disabled={isRecording}
              className={isRecording ? "bg-red-50" : ""}
            />
          </div>

          <Button
            onClick={() => handleSend()}
            size="icon"
            className="flex-shrink-0"
            disabled={!input.trim() && !attachedFile}
          >
            <Send className="w-5 h-5" />
          </Button>

          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={handleVoiceRecord}
            title={`Speak in ${languageNames[language]}`}
          >
            <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}