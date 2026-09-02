import { ArrowRight, CheckCircle2, FileText, HeartHandshake, Languages, Mic, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { SectionCard } from "../components/SectionCard";
import { InlineAlert } from "../components/ui/InlineAlert";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";

export function DashboardPage() {
  const { profile, user, notifications, language } = useAppContext();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/recommendations").then((res) => setRecommendations(res.data)).catch(() => setRecommendations([]));
    api.get("/api/welfare-gaps").then((res) => setGaps(res.data)).catch(() => setGaps([]));
  }, [profile]);

  const readiness = Math.min(100, (profile.available_documents?.length || 0) * 15 + (profile.age ? 20 : 0) + (profile.occupation ? 20 : 0) + (profile.state ? 20 : 0));

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
            onLinkClick={() => { setDismissedAlert(true); navigate("/notifications"); }}
            variant="teal"
          />
        )}
      </AnimatePresence>
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sahaya-saffron">{t(language, "dashboardTitle")}</p>
            <h1 className="mt-1 text-2xl font-bold text-sahaya-ink md:text-3xl">
              {t(language, "goodMorning")}, {user?.full_name || (language === "hi" ? "नागरिक" : language === "kn" ? "ನಾಗರಿಕ" : "Citizen")}
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600">{t(language, "dashboardSubtitle")}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/find-schemes" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sahaya-green px-5 font-semibold text-white">
                {t(language, "findBenefits")} <ArrowRight size={18} />
              </Link>
              <Link to="/chat" className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 font-semibold text-sahaya-green">
                <Mic size={18} /> {t(language, "voiceTextCta")}
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <Languages className="mb-2 text-sahaya-green" />
              <b>{language === "hi" ? "3 भाषाएँ" : language === "kn" ? "3 ಭಾಷೆಗಳು" : "3 languages"}</b>
              <p className="text-slate-600">English, Hindi, Kannada</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <ShieldCheck className="mb-2 text-sahaya-green" />
              <b>{t(language, "privacyArchitecture")}</b>
              <p className="text-slate-600">{language === "hi" ? "केवल न्यूनतम डेटा" : language === "kn" ? "ಕನಿಷ್ಠ ಡೇಟಾ ಮಾತ್ರ" : "Minimum data only"}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title={t(language, "welfareReadiness")}>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-bold text-sahaya-green">{readiness}%</div>
            <div className="pb-2 text-sm text-slate-600">
              {language === "hi" ? "आवेदन के लिए तैयार" : language === "kn" ? "ಅರ್ಜಿಗೆ ಸಿದ್ಧವಾಗಿದೆ" : "ready for guided applications"}
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-sahaya-green" style={{ width: `${readiness}%` }} />
          </div>
          <div className="mt-4 grid gap-2 text-sm">
            {readinessFactors.map((factor) => (
              <div key={factor.label} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className={factor.ready ? "text-sahaya-green" : "text-slate-300"} size={18} /> {factor.label}
                </span>
                <span className={factor.ready ? "font-semibold text-sahaya-green" : "text-slate-500"}>
                  {factor.ready ? (language === "hi" ? "तैयार" : language === "kn" ? "ಸಿದ್ಧ" : "Ready") : factor.action}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "pendingActions")}>
          <div className="space-y-3 text-sm">
            <Link to="/profile" className="flex min-h-12 items-center justify-between rounded-xl border p-3 hover:bg-stone-50">
              <span>
                <UserRoundCheck className="mr-2 inline text-sahaya-green" size={18} />
                {t(language, "completeProfile")}
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/documents" className="flex min-h-12 items-center justify-between rounded-xl border p-3 hover:bg-stone-50">
              <span>
                <FileText className="mr-2 inline text-sahaya-green" size={18} />
                {t(language, "prepareDocuments")}
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/eligibility" className="flex min-h-12 items-center justify-between rounded-xl border p-3 hover:bg-stone-50">
              <span>
                <HeartHandshake className="mr-2 inline text-sahaya-green" size={18} />
                {t(language, "checkEligibility")}
              </span>
              <ArrowRight size={16} />
            </Link>
            <Link to="/notifications" className="flex min-h-12 items-center justify-between rounded-xl border p-3 hover:bg-stone-50">
              <span>
                {notifications.length} {t(language, "activeNotifications")}
              </span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title={t(language, "benefitsForYou")}>
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((item) => (
              <div key={item.scheme_id} className="rounded-xl border p-3">
                <div className="font-semibold">{item.scheme_name}</div>
                <div className="text-sm text-slate-600">Match: {item.relevance_score}%</div>
                <div className="text-sm">{item.reason}</div>
                <Link to="/eligibility" className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-sahaya-green">
                  {t(language, "checkEligibility")}
                </Link>
              </div>
            ))}
            {recommendations.length === 0 && <p className="text-sm text-slate-600">{t(language, "completeProfileForRecommendations")}</p>}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "missingBenefits")}>
          <div className="space-y-3">
            {gaps.slice(0, 3).map((item) => (
              <div key={item.scheme} className="rounded-xl border p-3">
                <div className="font-semibold">{item.scheme}</div>
                <div className="text-sm text-slate-600">{item.why_it_may_apply}</div>
                <div className="text-sm">{item.recommended_next_action}</div>
              </div>
            ))}
            {gaps.length === 0 && <p className="text-sm text-slate-600">{t(language, "noGapsYet")}</p>}
          </div>
        </SectionCard>

        <SectionCard title={t(language, "familyBenefits")}>
          <div className="space-y-2 text-sm">
            <div>
              {t(language, "familyMembersInProfile")}: {profile.family_members?.length || 0}
            </div>
            <div>
              {t(language, "documentsReady")}: {profile.available_documents?.length || 0}
            </div>
            <div className="rounded-xl bg-stone-50 p-3 font-medium">
              {language === "hi"
                ? "खोजें → पात्र → दस्तावेज़ → आवेदन → सत्यापन → लाभ"
                : language === "kn"
                ? "ಹುಡುಕಿ → ಅರ್ಹರು → ದಾಖಲೆ → ಅರ್ಜಿ → ಪರಿಶೀಲನೆ → ಪ್ರಯೋಜನ"
                : "Discover → Eligible → Documents → Apply → Verification → Benefit"}
            </div>
            <Link to="/family" className="inline-flex min-h-10 items-center font-semibold text-sahaya-green">
              {t(language, "optimizeFamilyBenefits")}
            </Link>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
