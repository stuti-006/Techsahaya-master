import { HandHelping, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { t, type TranslationKey } from "../utils/i18n";
import { SUPPORTED_LANGUAGES } from "../utils/languages";

const items: { to: string; labelKey: TranslationKey }[] = [
  { to: "/", labelKey: "home" },
  { to: "/how-it-works", labelKey: "howItWorks" },
  { to: "/schemes", labelKey: "schemes" },
  { to: "/security", labelKey: "securityPrivacy" },
  { to: "/about", labelKey: "about" }
];

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, offline } = useAppContext();
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 text-sahaya-green">
            <div className="rounded-xl bg-sahaya-green p-2 text-white"><HandHelping size={20} /></div>
            <div>
              <div className="font-bold">Tech Sahaya</div>
              <div className="text-xs text-slate-500">{t(language, "publicTagline")}</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {items.map((item) => <NavLink key={item.to} to={item.to} className="text-sm text-slate-700">{t(language, item.labelKey)}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <select aria-label="Language selector" className="min-h-12 rounded-xl border px-3" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeLabel} ({lang.label})
                </option>
              ))}
            </select>
            <Link to="/login" className="hidden min-h-12 items-center rounded-xl border px-4 md:inline-flex">{t(language, "login")}</Link>
            <Link to="/signup" className="inline-flex min-h-12 items-center rounded-xl bg-sahaya-green px-4 text-white">{t(language, "getStarted")}</Link>
          </div>
        </div>
        {offline && <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">You are offline. Cached scheme information is still available.</div>}
      </header>
      <main>{children}</main>
      <footer className="border-t bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3">
          <div><div className="font-semibold">Tech Sahaya</div><p className="mt-2 text-sm text-slate-600">Discover, understand, verify, prepare, apply, and track welfare benefits with explainable assistance.</p></div>
          <div><div className="font-semibold">Trust</div><div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={16} /> Privacy-by-design</div><div className="mt-2 flex items-center gap-2 text-sm text-slate-600"><LockKeyhole size={16} /> Role-based access control</div></div>
          <div><div className="font-semibold">Responsible guidance</div><p className="mt-2 text-sm text-slate-600">Designed to align with DPDP Act principles. Always verify final eligibility on the official portal.</p></div>
        </div>
      </footer>
    </div>
  );
}
