import { Link } from "react-router-dom";
import { Mic, ShieldCheck, Languages, FileSearch2 } from "lucide-react";
import { SectionCard } from "../components/SectionCard";
import { useAppContext } from "../context/AppContext";
import { t } from "../utils/i18n";

export function HomePage() {
  const { language, personas, loadPersona } = useAppContext();
  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="grid gap-8 rounded-3xl border bg-white p-8 shadow-card lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-sahaya-green">{t(language, "gateway")}</p>
          <h1 className="max-w-3xl text-4xl font-bold text-slate-900 md:text-5xl">{t(language, "heroTitle")}</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">{t(language, "heroBody")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/signup" className="inline-flex min-h-12 items-center rounded-xl bg-sahaya-green px-5 text-white">{t(language, "findMyBenefits")}</Link>
            <Link to="/schemes" className="inline-flex min-h-12 items-center rounded-xl border px-5">{t(language, "exploreSchemes")}</Link>
          </div>
        </div>
        <div className="rounded-3xl bg-stone-50 p-6">
          <div className="space-y-4">
            {["Citizen", "Discover", "Check Eligibility", "Prepare Documents", "Apply", "Track Benefits"].map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-2xl border bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sahaya-green text-white">{index + 1}</div>
                <div className="font-medium">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-4">
        <SectionCard title={t(language, "multilingualAccess")}><div className="flex items-start gap-3"><Languages className="text-sahaya-green" /><p className="text-sm text-slate-600">Full support for 9 Indian languages: English, Hindi, Kannada, Telugu, Tamil, Malayalam, Bengali, Marathi, and Gujarati.</p></div></SectionCard>
        <SectionCard title={t(language, "voiceFirst")}><div className="flex items-start gap-3"><Mic className="text-sahaya-green" /><p className="text-sm text-slate-600">Tap and speak about schemes, eligibility, and documents with safe text fallback.</p></div></SectionCard>
        <SectionCard title={t(language, "explainableEligibility")}><div className="flex items-start gap-3"><FileSearch2 className="text-sahaya-green" /><p className="text-sm text-slate-600">Rule-based results explain what matched, what failed, and what to try next.</p></div></SectionCard>
        <SectionCard title={t(language, "privacyArchitecture")}><div className="flex items-start gap-3"><ShieldCheck className="text-sahaya-green" /><p className="text-sm text-slate-600">Consent-first design, masked document metadata, audit logging, and no raw Aadhaar storage.</p></div></SectionCard>
      </section>
      <SectionCard title="Quick start profiles">
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(personas).map(([key, persona]) => (
            <button key={key} onClick={() => loadPersona(key)} className="min-h-12 rounded-xl border p-4 text-left hover:border-sahaya-green">
              <div className="font-semibold">{persona.label}</div>
              <div className="text-sm text-slate-600">Load this profile after login to explore recommendations quickly</div>
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
