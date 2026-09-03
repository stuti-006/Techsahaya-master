import { ArrowRight, CheckCircle2, FileText, HeartHandshake, Languages, Mic, ShieldCheck, UserRoundCheck, Sparkles, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { SectionCard } from "../components/SectionCard";
import { InlineAlert } from "../components/ui/InlineAlert";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";
import type { EligibilityProfile } from "../types";

const STARTER_PERSONAS = [
  {
    key: "farmer",
    emoji: "🌾",
    title: "Small Farmer",
    desc: "Age 45, Karnataka, 2.5 acres, ₹1.2L income",
    profile: {
      age: 45,
      gender: "male",
      state: "Karnataka",
      occupation: "Farmer",
      income: 120000,
      landholding: 2.5,
      disability: false,
      available_documents: ["land_record", "ration_card", "income_certificate"],
    } as EligibilityProfile,
  },
  {
    key: "student",
    emoji: "🎓",
    title: "College Student",
    desc: "Age 20, Karnataka, Student, ₹1.5L income",
    profile: {
      age: 20,
      gender: "female",
      state: "Karnataka",
      occupation: "Student",
      income: 150000,
      landholding: 0,
      disability: false,
      available_documents: ["income_certificate", "caste_certificate"],
    } as EligibilityProfile,
  },
  {
    key: "woman_entrepreneur",
    emoji: "👩",
    title: "Self-Employed Woman",
    desc: "Age 36, Karnataka, Tailoring / SHG, ₹90K income",
    profile: {
      age: 36,
      gender: "female",
      state: "Karnataka",
      occupation: "Self-Employed",
      income: 90000,
      landholding: 0,
      disability: false,
      available_documents: ["ration_card", "income_certificate"],
    } as EligibilityProfile,
  },
  {
    key: "worker",
    emoji: "🏗️",
    title: "Construction Worker",
    desc: "Age 34, Karnataka, Daily Wage, ₹1.4L income",
    profile: {
      age: 34,
      gender: "male",
      state: "Karnataka",
      occupation: "Construction Worker",
      income: 140000,
      landholding: 0,
      disability: false,
      available_documents: ["ration_card", "income_certificate"],
    } as EligibilityProfile,
  },
];

export function DashboardPage() {
  const { profile, setProfile, user, notifications, language, refreshProfile } = useAppContext();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [loadingPersona, setLoadingPersona] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const [recRes, gapRes] = await Promise.all([
        api.get("/api/recommendations").catch(() => ({ data: [] })),
        api.get("/api/welfare-gaps").catch(() => ({ data: [] })),
      ]);
      setRecommendations(recRes.data || []);
      setGaps(gapRes.data || []);
    } catch {
      setRecommendations([]);
      setGaps([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const handleApplyPersona = async (p: typeof STARTER_PERSONAS[0]) => {
    setLoadingPersona(true);
    try {
      setProfile(p.profile);
      await api.put("/api/profile", {
        ...p.profile,
        preferred_language: language,
        consent_given: true,
      });
      await refreshProfile();
      await fetchDashboardData();
    } catch {
      undefined;
    } finally {
      setLoadingPersona(false);
    }
  };

  const isProfileEmpty = !profile.age && !profile.occupation && !profile.state;

  const readiness = Math.min(
    100,
    (profile.available_documents?.length || 0) * 15 +
      (profile.age ? 20 : 0) +
      (profile.occupation ? 20 : 0) +
      (profile.state ? 20 : 0)
  );

  const readinessFactors = [
    {
      label: language === "hi" ? "प्रोफ़ाइल विवरण" : language === "kn" ? "ಪ್ರೊಫೈಲ್ ವಿವರಗಳು" : "Profile details",
      ready: Boolean(profile.age && profile.state),
      action: language === "hi" ? "आयु और राज्य जोड़ें" : language === "kn" ? "ವಯಸ್ಸು ಮತ್ತು ರಾಜ್ಯ ಸೇರಿಸಿ" : "Add age and state",
    },
    {
      label: language === "hi" ? "व्यवसाय" : language === "kn" ? "ಉದ್ಯೋಗ" : "Occupation",
      ready: Boolean(profile.occupation),
      action: language === "hi" ? "व्यवसाय जोड़ें" : language === "kn" ? "ಉದ್ಯೋಗ ಸೇರಿಸಿ" : "Add occupation",
    },
    {
      label: language === "hi" ? "दस्तावेज़" : language === "kn" ? "ದಾಖಲೆಗಳು" : "Documents",
      ready: Boolean(profile.available_documents?.length),
      action: language === "hi" ? "दस्तावेज़ जोड़ें" : language === "kn" ? "ದಾಖಲೆ ಸೇರಿಸಿ" : "Add document names",
    },
    {
      label: language === "hi" ? "परिवार" : language === "kn" ? "ಕುಟುಂಬ" : "Family",
      ready: Boolean(profile.family_members?.length),
      action: language === "hi" ? "परिवार सदस्य जोड़ें" : language === "kn" ? "ಕುಟುಂಬ ಸದಸ್ಯರನ್ನು ಸೇರಿಸಿ" : "Add family members",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Notification alert banner */}
      <AnimatePresence>
        {notifications.length > 0 && !dismissedAlert && (
          <InlineAlert
            message={`${notifications.length} ${t(language, "activeNotifications")}`}
            linkText={language === "hi" ? "देखें" : language === "kn" ? "ನೋಡಿ" : "View"}
            onLinkClick={() => {
              setDismissedAlert(true);
              navigate("/notifications");
            }}
            variant="teal"
          />
        )}
      </AnimatePresence>

      {/* Main Welcome Hero */}
      <section className="rounded-3xl bg-white p-5 sm:p-6 shadow-card border border-slate-100">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-sahaya-saffron">
              {t(language, "dashboardTitle")}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 md:text-3xl">
              {t(language, "goodMorning")}, {user?.full_name || (language === "hi" ? "नागरिक" : language === "kn" ? "ನಾಗರಿಕ" : "Citizen")}
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t(language, "dashboardSubtitle")}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/find-schemes"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#164E35] px-5 font-bold text-white shadow-md hover:bg-[#1F5F3A] transition text-sm"
              >
                {t(language, "findBenefits")} <ArrowRight size={16} />
              </Link>
              <Link
                to="/chat"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-stone-50 px-5 font-bold text-[#164E35] hover:bg-stone-100 transition text-sm"
              >
                <Mic size={16} /> {t(language, "voiceTextCta")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <Languages className="mb-2 text-[#164E35]" size={20} />
              <b className="text-slate-900 block font-bold">9 Indic Languages</b>
              <p className="text-slate-600 text-xs mt-0.5">EN, हिन्दी, ಕನ್ನಡ, తెలుగు, தமிழ், മലയാളം, বাংলা, मराठी, ગુજરાતી</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <ShieldCheck className="mb-2 text-[#164E35]" size={20} />
              <b className="text-slate-900 block font-bold">{t(language, "privacyArchitecture")}</b>
              <p className="text-slate-600 text-xs mt-0.5">
                {language === "hi" ? "केवल न्यूनतम डेटा (DPDP 2023)" : language === "kn" ? "ಕನಿಷ್ಠ ಡೇಟಾ ಮಾತ್ರ" : "Zero-knowledge processing"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Profile Setup Banner if Profile is Empty */}
      {isProfileEmpty && (
        <section className="rounded-3xl border-2 border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white p-5 sm:p-6 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#164E35] px-3 py-1 text-xs font-bold text-white mb-2">
                <Sparkles size={13} className="text-[#FF4365]" />
                <span>Quick Setup (See Your Schemes in 1-Click)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Personalize your profile to discover eligible government schemes
              </h2>
              <p className="mt-1 text-xs text-slate-600 max-w-2xl">
                Choose a starter persona or complete your details to unlock verified match scores, missing document audits, and welfare gap analysis.
              </p>
            </div>

            <Link
              to="/profile-setup"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#164E35] px-5 text-xs font-bold text-white shadow-md hover:bg-[#1F5F3A] transition shrink-0"
            >
              <UserRoundCheck size={16} /> Complete Full Setup
            </Link>
          </div>

          <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-emerald-200/60">
            {STARTER_PERSONAS.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={loadingPersona}
                onClick={() => handleApplyPersona(p)}
                className="flex items-center gap-3 rounded-2xl border border-emerald-300/80 bg-white p-3 text-left shadow-xs hover:border-[#164E35] hover:bg-emerald-50/50 transition cursor-pointer disabled:opacity-50"
              >
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                    {p.title}
                    <UserCheck size={12} className="text-[#164E35]" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Welfare Readiness & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={t(language, "welfareReadiness")}>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-extrabold text-[#164E35]">{readiness}%</div>
            <div className="pb-2 text-xs font-semibold text-slate-600">
              {language === "hi" ? "आवेदन के लिए तैयार" : language === "kn" ? "ಅರ್ಜಿಗೆ ಸಿದ್ಧವಾಗಿದೆ" : "ready for guided applications"}
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-[#164E35] transition-all duration-500" style={{ width: `${readiness}%` }} />
          </div>
          <div className="mt-4 grid gap-2 text-xs sm:text-sm">
            {readinessFactors.map((factor) => (
              <div key={factor.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-stone-50/50 p-2.5 sm:p-3">
                <span className="flex items-center gap-2 text-slate-800 font-medium">
                  <CheckCircle2 className={factor.ready ? "text-[#164E35]" : "text-slate-300"} size={16} /> {factor.label}
                </span>
                <span className={factor.ready ? "font-bold text-[#164E35]" : "text-slate-500 font-medium"}>
                  {factor.ready ? (language === "hi" ? "तैयार" : language === "kn" ? "ಸಿದ್ಧ" : "Ready") : factor.action}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "pendingActions")}>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <Link to="/profile-setup" className="flex min-h-11 items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-stone-50 transition">
              <span className="font-semibold text-slate-800">
                <UserRoundCheck className="mr-2 inline text-[#164E35]" size={16} />
                {t(language, "completeProfile")}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/documents" className="flex min-h-11 items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-stone-50 transition">
              <span className="font-semibold text-slate-800">
                <FileText className="mr-2 inline text-[#164E35]" size={16} />
                {t(language, "prepareDocuments")}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/eligibility" className="flex min-h-11 items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-stone-50 transition">
              <span className="font-semibold text-slate-800">
                <HeartHandshake className="mr-2 inline text-[#164E35]" size={16} />
                {t(language, "checkEligibility")}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
            <Link to="/notifications" className="flex min-h-11 items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-stone-50 transition">
              <span className="font-semibold text-slate-800">
                {notifications.length} {t(language, "activeNotifications")}
              </span>
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </SectionCard>
      </div>

      {/* Eligible Benefits & Recommendations Grid */}
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title={t(language, "benefitsForYou")}>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((item) => (
              <div key={item.scheme_id} className="rounded-xl border border-slate-100 bg-stone-50/50 p-3">
                <div className="font-bold text-slate-900 text-sm">{item.scheme_name}</div>
                <div className="text-xs font-semibold text-emerald-700 mt-0.5">Match: {item.relevance_score}%</div>
                <div className="text-xs text-slate-600 mt-1">{item.reason}</div>
                <Link to="/eligibility" className="mt-2 inline-flex items-center text-xs font-bold text-[#164E35] hover:underline">
                  {t(language, "checkEligibility")} →
                </Link>
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="p-3 text-xs text-slate-500">
                {t(language, "completeProfileForRecommendations")}
                <div className="mt-2">
                  <Link to="/profile-setup" className="font-bold text-[#164E35] underline">
                    Set up profile now →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "missingBenefits")}>
          <div className="space-y-3">
            {gaps.slice(0, 3).map((item) => (
              <div key={item.scheme} className="rounded-xl border border-slate-100 bg-stone-50/50 p-3">
                <div className="font-bold text-slate-900 text-sm">{item.scheme}</div>
                <div className="text-xs text-slate-600 mt-1">{item.why_it_may_apply}</div>
                <div className="text-xs font-medium text-amber-700 mt-1">{item.recommended_next_action}</div>
              </div>
            ))}
            {gaps.length === 0 && <p className="text-xs text-slate-500 p-3">{t(language, "noGapsYet")}</p>}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "familyBenefits")}>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="text-slate-700">
              {t(language, "familyMembersInProfile")}: <strong className="text-slate-900">{profile.family_members?.length || 0}</strong>
            </div>
            <div className="text-slate-700">
              {t(language, "documentsReady")}: <strong className="text-slate-900">{profile.available_documents?.length || 0}</strong>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 text-xs font-medium text-slate-700 border border-slate-100">
              {language === "hi"
                ? "खोजें → पात्र → दस्तावेज़ → आवेदन → सत्यापन → लाभ"
                : language === "kn"
                ? "ಹುಡುಕಿ → ಅರ್ಹರು → ದಾಖಲೆ → ಅರ್ಜಿ → ಪರಿಶೀಲನೆ → ಪ್ರಯೋಜನ"
                : "Discover → Eligible → Documents → Apply → Verification → Benefit"}
            </div>
            <Link to="/family" className="inline-flex items-center text-xs font-bold text-[#164E35] hover:underline pt-1">
              {t(language, "optimizeFamilyBenefits")} →
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
