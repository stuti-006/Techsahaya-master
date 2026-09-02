import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Globe, LogIn, ArrowRight } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { Footer } from "./Footer";
import { TechSahayaLogo } from "./TechSahayaLogo";
import { t, type TranslationKey } from "../utils/i18n";
import { SUPPORTED_LANGUAGES } from "../utils/languages";

const navItems: { to: string; labelKey: TranslationKey }[] = [
  { to: "/home", labelKey: "home" },
  { to: "/how-it-works", labelKey: "howItWorks" },
  { to: "/schemes", labelKey: "schemes" },
  { to: "/security", labelKey: "securityPrivacy" },
  { to: "/about", labelKey: "about" },
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, offline } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-between overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-[#1A3D2E]/10 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-3.5">
          {/* Brand Logo */}
          <Link to="/home" className="flex items-center shrink-0">
            <TechSahayaLogo size={32} glowing={true} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-xs font-bold uppercase tracking-widest transition-colors ${
                    isActive
                      ? "text-[#1A3D2E] underline underline-offset-8 decoration-2 decoration-[#1A3D2E]"
                      : "text-slate-600 hover:text-[#1A3D2E]"
                  }`
                }
              >
                {t(language, item.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Actions & Language Selector */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Language Selector */}
            <div className="relative flex items-center gap-1 sm:gap-1.5">
              <Link
                to="/language"
                title="Open Interactive Language Screen"
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1A3D2E] hover:bg-stone-50 transition shadow-xs"
                aria-label="Language selection screen"
              >
                <Globe size={16} />
              </Link>
              <select
                aria-label={t(language, "chooseLanguage")}
                className="h-9 sm:h-10 rounded-xl border border-slate-200 bg-white pl-2 pr-4 text-xs font-semibold text-slate-700 shadow-xs focus:border-[#1A3D2E] focus:outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeLabel} ({lang.code.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Auth Links */}
            <Link
              to="/login"
              className="hidden h-10 items-center rounded-xl border border-[#1A3D2E] px-3.5 text-xs font-bold uppercase tracking-wider text-[#1A3D2E] hover:bg-[#1A3D2E] hover:text-white transition sm:inline-flex"
            >
              {t(language, "login")}
            </Link>
            <Link
              to="/signup"
              className="hidden h-10 items-center rounded-xl bg-[#1A3D2E] px-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#1A3D2E]/90 transition sm:inline-flex"
            >
              {t(language, "getStarted")}
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1A3D2E] shadow-xs lg:hidden focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Offline Banner */}
        {offline && (
          <div className="bg-amber-100 px-3 py-1.5 text-center text-xs font-medium text-amber-900 border-b border-amber-200">
            {t(language, "offlineChat")}
          </div>
        )}

        {/* Mobile Slide-down Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-[#1A3D2E]/10 bg-white px-5 py-4 lg:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-[#1A3D2E]/10 text-[#1A3D2E] font-bold"
                        : "text-slate-700 hover:bg-stone-50"
                    }`
                  }
                >
                  <span>{t(language, item.labelKey)}</span>
                  <ArrowRight size={14} className="opacity-40" />
                </NavLink>
              ))}

              <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#1A3D2E] text-xs font-bold uppercase tracking-wider text-[#1A3D2E]"
                >
                  <LogIn size={15} /> {t(language, "login")}
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1A3D2E] text-xs font-bold uppercase tracking-wider text-white shadow-sm"
                >
                  {t(language, "getStarted")}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1">{children}</main>

      {/* Rich Brand Footer */}
      <Footer />
    </div>
  );
}
