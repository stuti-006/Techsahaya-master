import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, ShieldCheck, Sparkles, FileCheck2, Globe, CheckCircle2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { t, type TranslationKey } from "../utils/i18n";

interface FaqItem {
  id: string;
  qKey: TranslationKey;
  aKey: TranslationKey;
  icon: React.ReactNode;
  category: string;
}

export function FaqSection() {
  const { language } = useAppContext();
  const [openId, setOpenId] = useState<string | null>("faq1");

  const faqs: FaqItem[] = [
    {
      id: "faq1",
      qKey: "faq1Q",
      aKey: "faq1A",
      icon: <FileCheck2 className="text-[#1A3D2E]" size={18} />,
      category: language === "hi" ? "सत्यापन और स्रोत" : language === "kn" ? "ಪರಿಶೀಲನೆ ಮತ್ತು ಮೂಲಗಳು" : "Verification & Sources",
    },
    {
      id: "faq2",
      qKey: "faq2Q",
      aKey: "faq2A",
      icon: <ShieldCheck className="text-emerald-700" size={18} />,
      category: language === "hi" ? "DPDP गोपनीयता" : language === "kn" ? "DPDP ಗೌಪ್ಯತೆ" : "DPDP Act Privacy",
    },
    {
      id: "faq3",
      qKey: "faq3Q",
      aKey: "faq3A",
      icon: <Sparkles className="text-[#E5832E]" size={18} />,
      category: language === "hi" ? "पात्रता इंजन" : language === "kn" ? "ಅರ್ಹತಾ ಎಂಜಿನ್" : "Explainable Rules",
    },
    {
      id: "faq4",
      qKey: "faq4Q",
      aKey: "faq4A",
      icon: <CheckCircle2 className="text-[#1A3D2E]" size={18} />,
      category: language === "hi" ? "निःशुल्क सेवा" : language === "kn" ? "ಉಚಿತ ಸೇವೆ" : "100% Free Access",
    },
    {
      id: "faq5",
      qKey: "faq5Q",
      aKey: "faq5A",
      icon: <Globe className="text-blue-700" size={18} />,
      category: language === "hi" ? "भाषा और आवाज़" : language === "kn" ? "ಭಾಷೆ ಮತ್ತು ಧ್ವನಿ" : "Languages & Voice",
    },
    {
      id: "faq6",
      qKey: "faq6Q",
      aKey: "faq6A",
      icon: <ShieldCheck className="text-red-700" size={18} />,
      category: language === "hi" ? "डेटा नियंत्रण" : language === "kn" ? "ಡೇಟಾ ನಿಯಂತ್ರಣ" : "Data Erasure Rights",
    },
  ];

  const toggleFaq = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-8 md:p-12 shadow-card">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1A3D2E]/10 px-3.5 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#1A3D2E]">
          <HelpCircle size={14} />
          {t(language, "faqsTitle")}
        </div>
        <h2 className="mt-3 font-serif text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1A3D2E]">
          {t(language, "faqsTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
          {t(language, "faqsSubtitle")}
        </p>
      </div>

      {/* Accordion list */}
      <div className="mt-6 sm:mt-10 mx-auto max-w-3xl space-y-2.5 sm:space-y-3.5">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;

          return (
            <div
              key={faq.id}
              className={`rounded-xl sm:rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? "border-[#1A3D2E] bg-[#FAF7F0] shadow-xs"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="flex w-full items-center justify-between gap-3 p-3.5 sm:p-5 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white shadow-xs border border-slate-100">
                    {faq.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#E5832E] block">
                      {faq.category}
                    </span>
                    <h3 className="font-serif text-xs sm:text-base font-bold text-[#1A3D2E] leading-snug">
                      {t(language, faq.qKey)}
                    </h3>
                  </div>
                </div>

                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#1A3D2E] shadow-xs"
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 text-xs sm:text-sm leading-relaxed text-slate-700 border-t border-slate-200/60 mt-1">
                      {t(language, faq.aKey)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
