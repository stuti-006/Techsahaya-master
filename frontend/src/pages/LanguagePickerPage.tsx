import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Globe, Check } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { TechSahayaLogo } from "../components/TechSahayaLogo";

interface LanguageInfo {
  value: string;
  label: string;
  native: string;
  flag: string;
  tagline: string;
  headerTitle: string;
  headerSubtitle: string;
  confirmationText: string;
  badge: string;
}

const LANGUAGES: LanguageInfo[] = [
  {
    value: "en",
    label: "English",
    native: "English",
    flag: "🇬🇧",
    tagline: "Discover and apply for government welfare schemes with ease",
    headerTitle: "Choose your preferred language",
    headerSubtitle: "You can change this anytime from your profile settings.",
    confirmationText: "Selected • Proceeding to Login...",
    badge: "Active",
  },
  {
    value: "hi",
    label: "Hindi",
    native: "हिंदी",
    flag: "🇮🇳",
    tagline: "सरकारी कल्याणकारी योजनाओं की सरल खोज और सहायता",
    headerTitle: "अपनी पसंदीदा भाषा चुनें",
    headerSubtitle: "आप इसे बाद में प्रोफ़ाइल सेटिंग से कभी भी बदल सकते हैं।",
    confirmationText: "चयनित • लॉगिन पर जा रहे हैं...",
    badge: "सक्रिय",
  },
  {
    value: "kn",
    label: "Kannada",
    native: "ಕನ್ನಡ",
    flag: "🇮🇳",
    tagline: "ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ಸುಲಭ ಶೋಧ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ",
    headerTitle: "ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    headerSubtitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಿಂದ ನೀವು ಇದನ್ನು ಯಾವಾಗ ಬೇಕಾದರೂ ಬದಲಾಯಿಸಬಹುದು.",
    confirmationText: "ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ • ಲಾಗಿನ್‌ಗೆ ತೆರಳಲಾಗುತ್ತಿದೆ...",
    badge: "ಸಕ್ರಿಯ",
  },
];

export function LanguagePickerPage() {
  const { setLanguage } = useAppContext();
  const navigate = useNavigate();
  const [hoveredLang, setHoveredLang] = useState<string>("en");
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  const activeLangInfo =
    LANGUAGES.find((l) => l.value === (selectedLang || hoveredLang)) || LANGUAGES[0];

  const handleSelectLanguage = (langVal: string) => {
    setSelectedLang(langVal);
    setLanguage(langVal);
    localStorage.setItem("ts_lang_chosen", "1");
    setTimeout(() => {
      navigate("/login");
    }, 450);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#FAF8F3] px-4 py-12">
      {/* Subtle organic background glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#1A3D2E]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#E5832E]/5 blur-3xl" />

      {/* Brand Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-8 flex flex-col items-center gap-3 text-center"
      >
        <TechSahayaLogo size={60} glowing={true} />
      </motion.div>

      {/* Interactive Selection Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="w-full max-w-xl rounded-3xl border border-[#1A3D2E]/10 bg-white p-6 shadow-2xl shadow-[#1A3D2E]/8 md:p-9"
      >
        {/* Dynamic header reflecting hovered / chosen language */}
        <div className="flex items-center gap-2 text-[#1A3D2E]">
          <Globe size={18} className="text-[#E5832E]" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Language Preference / भाषा चयन
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeLangInfo.value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-3 min-h-[70px]"
          >
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#1A3D2E] md:text-3xl">
              {activeLangInfo.headerTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {activeLangInfo.headerSubtitle}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Options list with instant hover feedback */}
        <div className="mt-6 flex flex-col gap-3.5">
          {LANGUAGES.map((lang, index) => {
            const isHovered = hoveredLang === lang.value;
            const isSelected = selectedLang === lang.value;

            return (
              <motion.button
                key={lang.value}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12 + index * 0.06 }}
                onMouseEnter={() => setHoveredLang(lang.value)}
                onClick={() => handleSelectLanguage(lang.value)}
                className={`group relative flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-[#1A3D2E] bg-[#1A3D2E] text-white shadow-lg"
                    : isHovered
                    ? "border-[#1A3D2E]/70 bg-[#FAF8F3] text-[#1A3D2E]"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl select-none">{lang.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-serif text-lg font-bold ${isSelected ? "text-white" : "text-[#1A3D2E]"}`}>
                        {lang.native}
                      </span>
                      <span className={`text-xs font-semibold ${isSelected ? "text-emerald-200" : "text-slate-500"}`}>
                        ({lang.label})
                      </span>
                    </div>
                    <div className={`mt-0.5 text-xs ${isSelected ? "text-emerald-100" : "text-slate-600"}`}>
                      {lang.tagline}
                    </div>
                  </div>
                </div>

                {/* Right action indicator */}
                <div className="ml-3 flex shrink-0 items-center">
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 text-[#1A3D2E]"
                    >
                      <Check size={18} strokeWidth={3} />
                    </motion.div>
                  ) : isHovered ? (
                    <span className="rounded-full bg-[#1A3D2E]/10 px-3 py-1 text-xs font-bold text-[#1A3D2E]">
                      Select →
                    </span>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selected confirmation feedback */}
        <div className="mt-5 min-h-[32px] text-center">
          <AnimatePresence>
            {selectedLang && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-[#1A3D2E] border border-emerald-200"
              >
                <Check size={14} className="text-[#1A3D2E]" />
                {activeLangInfo.confirmationText}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p className="mt-8 text-center text-xs text-slate-400">
        DPDP Act 2023 Compliant • Privacy-First Architecture • Official Scheme Intelligence
      </p>
    </div>
  );
}
