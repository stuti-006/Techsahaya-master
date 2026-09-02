import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { TechSahayaLogo } from "./TechSahayaLogo";
import { t } from "../utils/i18n";

export function Footer() {
  const { language } = useAppContext();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t border-[#1A3D2E]/10 bg-[#FAF7F0] text-[#1A3D2E]">
      {/* Top Banner / Trust strip */}
      <div className="border-b border-[#1A3D2E]/10 bg-[#1A3D2E] text-[#FAF7F0] py-2 px-3 sm:px-4 text-center text-[10px] sm:text-xs tracking-widest uppercase font-semibold">
        🇮🇳 {t(language, "publicTagline")} • DPDP Act 2023 Architecture
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Emblem & Mission */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Link to="/home" className="flex items-center">
              <TechSahayaLogo size={32} glowing={true} />
            </Link>
            <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-slate-700">
              {t(language, "heroBody")}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1A3D2E]/80">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>{t(language, "featurePrivacyDesc")}</span>
            </div>
          </div>

          {/* Column 1: Schemes */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A3D2E]">
              {t(language, "schemes")}
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "allCategories")}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "farmers")}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "womenAndGirl")}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "students")}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "workersGroup")}
                </Link>
              </li>
              <li>
                <Link to="/schemes" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "disabilitiesGroup")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Explore */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A3D2E]">
              {t(language, "menu")}
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>
                <Link to="/home" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "home")}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "howItWorks")}
                </Link>
              </li>
              <li>
                <Link to="/eligibility" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "checkEligibility")}
                </Link>
              </li>
              <li>
                <Link to="/welfare-gaps" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "welfareGaps")}
                </Link>
              </li>
              <li>
                <Link to="/documents" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "documents")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Trust & Governance */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A3D2E]">
              {t(language, "securityPrivacy")}
            </h3>
            <ul className="mt-3.5 space-y-2 text-xs sm:text-sm text-slate-700">
              <li>
                <Link to="/security" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "privacyArchitecture")}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "profilePrivacy")}
                </Link>
              </li>
              <li>
                <Link to="/csc/dashboard" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "cscAssistance")}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#1A3D2E] hover:underline underline-offset-4 transition">
                  {t(language, "login")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter + Giant Brand Typography */}
          <div className="sm:col-span-2 lg:col-span-3 flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-xs sm:text-sm font-bold uppercase tracking-widest text-[#1A3D2E]">
                {language === "hi" ? "नागरिक अपडेट प्राप्त करें" : language === "kn" ? "ನಾಗರಿಕ ನವೀಕರಣಗಳನ್ನು ಪಡೆಯಿರಿ" : "Join Citizen Updates"}
              </h3>
              <p className="mt-1.5 text-xs text-slate-600">
                {language === "hi" ? "नई सरकारी योजनाओं के प्रकाशन की सीधी सूचना प्राप्त करें।" : language === "kn" ? "ಹೊಸ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ನೇರ ಅಧಿಸೂಚನೆಗಳನ್ನು ಪಡೆಯಿರಿ." : "Receive notifications when new central & state welfare schemes are officially published and verified."}
              </p>

              {subscribed ? (
                <div className="mt-3 flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-semibold text-emerald-900">
                  <Check size={14} className="text-emerald-700" />
                  {language === "hi" ? "सफलतापूर्वक सब्सक्राइब किया गया!" : language === "kn" ? "ಯಶಸ್ವಿಯಾಗಿ ಚಂದಾದಾರರಾಗಿದ್ದೀರಿ!" : "Subscribed for verified scheme updates!"}
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-3 flex items-center rounded-full border border-[#1A3D2E]/30 bg-white p-1 shadow-xs focus-within:border-[#1A3D2E]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={language === "hi" ? "ईमेल दर्ज करें" : language === "kn" ? "ಇಮೇಲ್ ನಮೂದಿಸಿ" : "Enter your email"}
                    className="w-full bg-transparent px-3 text-xs text-slate-800 placeholder-slate-400 outline-none"
                    required
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to updates"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1A3D2E] text-white hover:bg-[#1A3D2E]/90 transition cursor-pointer"
                  >
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}
            </div>

            {/* Editorial Wordmark */}
            <div className="mt-6 pt-2 select-none">
              <div className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tighter text-[#1A3D2E] leading-none">
                TECH<br />SAHAYA
              </div>
              <p className="mt-1 text-[9px] sm:text-[10px] tracking-widest uppercase text-slate-500 font-sans">
                Aapka Adhikar • Aapki Sahayata
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#1A3D2E]/10 pt-4 sm:pt-6 text-[11px] sm:text-xs text-slate-600 md:flex-row text-center sm:text-left">
          <div>
            Built with Care for Indian Citizens • © {new Date().getFullYear()} Tech Sahaya.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/privacy" className="hover:text-[#1A3D2E] hover:underline underline-offset-2">
              {t(language, "privacy")}
            </Link>
            <span>•</span>
            <Link to="/security" className="hover:text-[#1A3D2E] hover:underline underline-offset-2">
              {t(language, "securityPrivacy")}
            </Link>
            <span>•</span>
            <Link to="/about" className="hover:text-[#1A3D2E] hover:underline underline-offset-2">
              {t(language, "about")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
