import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Languages, FileSearch2, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { FaqSection } from "../components/FaqSection";
import { MorphingNotifyButton } from "../components/ui/MorphingNotifyButton";
import { useAppContext } from "../context/AppContext";
import { t, type TranslationKey } from "../utils/i18n";

export function HomePage() {
  const { language, personas, loadPersona, token } = useAppContext();
  const navigate = useNavigate();

  const handleSelectPersona = (key: string) => {
    loadPersona(key);
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/eligibility");
    }
  };

  const journeySteps: { num: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { num: "01", titleKey: "stepDiscover", descKey: "schemeDiscoverySubtitle" },
    { num: "02", titleKey: "stepCheckEligibility", descKey: "featureEligibilityDesc" },
    { num: "03", titleKey: "stepPrepareDocuments", descKey: "documentsIntro" },
    { num: "04", titleKey: "stepApply", descKey: "journeyUse" },
    { num: "05", titleKey: "stepTrackBenefits", descKey: "welfareGapsUse" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 sm:space-y-14 px-3.5 sm:px-6 py-6 sm:py-12">
      {/* Hero Section with Responsive Mobile-First Typography */}
      <section className="grid gap-6 sm:gap-10 rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:p-12 shadow-card">
        <div className="flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1A3D2E]/10 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#1A3D2E]">
              <Sparkles size={13} className="text-[#E5832E]" />
              {t(language, "gateway")}
            </div>
            <h1 className="mt-4 font-serif text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A3D2E] leading-tight sm:leading-[1.15]">
              {t(language, "heroTitle")}
            </h1>
            <p className="mt-4 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-700 md:text-lg">
              {t(language, "heroBody")}
            </p>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <Link
              to="/signup"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1A3D2E] px-6 font-bold uppercase tracking-wider text-xs text-white shadow-lg shadow-[#1A3D2E]/15 hover:bg-[#1A3D2E]/90 hover:scale-105 transition duration-200"
            >
              {t(language, "findMyBenefits")} <ArrowRight size={16} />
            </Link>
            <Link
              to="/schemes"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-[#1A3D2E] bg-transparent px-6 font-bold uppercase tracking-wider text-xs text-[#1A3D2E] hover:bg-[#1A3D2E] hover:text-white transition duration-200"
            >
              {t(language, "exploreSchemes")}
            </Link>
          </div>
        </div>

        {/* Step-by-Step Interactive Pathway */}
        <div className="flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-[#FAF7F0] p-5 sm:p-8 border border-[#1A3D2E]/10">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#E5832E]">
              {t(language, "welfareJourney")}
            </div>
            <h2 className="mt-1 font-serif text-lg sm:text-xl font-bold text-[#1A3D2E]">
              {t(language, "applicationSteps")}
            </h2>
          </div>

          <div className="mt-5 space-y-2.5 sm:space-y-3">
            {journeySteps.map((step) => (
              <div
                key={step.num}
                className="flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-3.5 shadow-xs transition hover:border-[#1A3D2E]/40"
              >
                <span className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-[#1A3D2E] text-xs font-bold text-white">
                  {step.num}
                </span>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-[#1A3D2E] truncate">{t(language, step.titleKey)}</div>
                  <div className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">{t(language, step.descKey)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 text-[#1A3D2E]">
            <Languages size={22} />
          </div>
          <h3 className="mt-3.5 font-serif text-base sm:text-lg font-bold text-[#1A3D2E]">{t(language, "multilingualAccess")}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {t(language, "featureMultilingualDesc")}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-amber-50 text-[#E5832E]">
            <FileSearch2 size={22} />
          </div>
          <h3 className="mt-3.5 font-serif text-base sm:text-lg font-bold text-[#1A3D2E]">{t(language, "explainableEligibility")}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {t(language, "featureEligibilityDesc")}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-blue-700">
            <Building2 size={22} />
          </div>
          <h3 className="mt-3.5 font-serif text-base sm:text-lg font-bold text-[#1A3D2E]">{t(language, "cscAssistance")}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {language === "hi"
              ? "ग्राम स्तरीय उद्यमियों और कॉमन सर्विस सेंटर के लिए विशेष ऑपरेटर मोड।"
              : language === "kn"
              ? "ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರಗಳ ಗ್ರಾಮ ಮಟ್ಟದ ಉದ್ಯಮಿಗಳಿಗೆ ಪ್ರತ್ಯೇಕ ಆಪರೇಟರ್ ಮೋಡ್."
              : "Dedicated assisted-service flow for Common Service Center village-level entrepreneurs."}
          </p>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-6 shadow-xs">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-700">
            <ShieldCheck size={22} />
          </div>
          <h3 className="mt-3.5 font-serif text-base sm:text-lg font-bold text-[#1A3D2E]">{t(language, "privacyArchitecture")}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
            {t(language, "featurePrivacyDesc")}
          </p>
        </div>
      </section>

      {/* Quick Start Personas */}
      <section className="rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-white p-5 sm:p-8 shadow-card">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#E5832E]">
              {t(language, "quickStartProfiles")}
            </div>
            <h2 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-[#1A3D2E]">
              {t(language, "quickStartProfiles")}
            </h2>
          </div>
          <p className="max-w-md text-xs text-slate-500">
            {t(language, "quickStartPersonaDesc")}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
          {Object.entries(personas).map(([key, persona]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectPersona(key)}
              className="group rounded-xl sm:rounded-2xl border-2 border-slate-200 p-4 sm:p-5 text-left transition hover:border-[#1A3D2E] hover:bg-[#FAF7F0] cursor-pointer shadow-xs"
            >
              <div className="font-serif text-sm sm:text-base font-bold text-[#1A3D2E] group-hover:underline">
                {persona.label}
              </div>
              <div className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                {key === "farmer_karnataka"
                  ? (language === "hi" ? "कर्नाटक के किसान: पीएम-किसान, कृषि सब्सिडी और भूमि योजनाएँ देखें।" : language === "kn" ? "ಕರ್ನಾಟಕದ ರೈತ: ಪಿಎಂ-ಕಿಸಾನ್ ಮತ್ತು ಕೃಷಿ ಸಹಾಯಧನ ಯೋಜನೆಗಳನ್ನು ನೋಡಿ." : "Smallholder farmer in Karnataka matching PM-Kisan and agriculture subsidies.")
                  : key === "student_general"
                  ? (language === "hi" ? "विद्यार्थी: उच्च शिक्षा छात्रवृत्ति, कौशल विकास और शिक्षा ऋण लाभ।" : language === "kn" ? "ವಿದ್ಯಾರ್ಥಿ: ಉನ್ನತ ಶಿಕ್ಷಣ ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಕೌಶಲ್ಯ ತರಬೇತಿ." : "Student profile matching post-matric scholarships and skill programs.")
                  : (language === "hi" ? "कम आय वाला परिवार: राशन, पीएम-आवास, उज्ज्वला और आयुष्मान भारत।" : language === "kn" ? "ಕಡಿಮೆ ಆದಾಯದ ಕುಟುಂಬ: ರೇಷನ್, ವಸತಿ, ಉಜ್ವಲ ಮತ್ತು ಆಯುಷ್ಮಾನ್ ಭಾರತ್." : "Household matching ration benefits, PM-Awas housing, and DBT subsidies.")}
              </div>
              <div className="mt-3 sm:mt-4 flex items-center text-xs font-bold text-[#1A3D2E] group-hover:translate-x-1 transition-transform">
                {language === "hi" ? "यह परिदृश्य लोड करें →" : language === "kn" ? "ಈ ಸನ್ನಿವೇಶವನ್ನು ಲೋಡ್ ಮಾಡಿ →" : "Load Scenario →"}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Multilingual FAQ Section */}
      <FaqSection />

      {/* Stay Updated Morphing Notification Section */}
      <section className="flex flex-col items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-3xl border border-[#1A3D2E]/10 bg-gradient-to-br from-[#1A3D2E]/5 via-[#FAF7F0] to-emerald-50 p-6 sm:p-10 text-center shadow-card">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-[#1A3D2E]">
          {language === "hi" ? "अपडेट रहें" : language === "kn" ? "ಅಪ್ಡೇಟ್ ಪಡೆಯಿರಿ" : "Stay Informed"}
        </span>
        <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-[#1A3D2E]">
          {language === "hi" ? "नई योजनाओं की जानकारी पाएं" : language === "kn" ? "ಹೊಸ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ತಿಳಿಯಿರಿ" : "Get Notified When New Verified Schemes Launch"}
        </h2>
        <p className="max-w-md text-xs sm:text-sm text-slate-600">
          {language === "hi" ? "नई योजनाएँ आने पर ईमेल सूचना पाएं। कोई स्पैम नहीं।" : language === "kn" ? "ಹೊಸ ಯೋಜನೆಗಳು ಬಂದಾಗ ಇಮೆಯಿಲ್ ಅಧಿಸೂಚನೆ ಪಡೆಯಿರಿ. ಯಾವುದೇ spam ಇಲ್ಲ." : "Subscribe to instant notifications whenever central ministries or state departments announce new welfare programs."}
        </p>
        <div className="mt-2 w-full flex justify-center">
          <MorphingNotifyButton
            buttonText={language === "hi" ? "सूचित करें" : language === "kn" ? "ತಿಳಿಸಿ" : "Notify Me"}
            placeholder={language === "hi" ? "आपका ईमेल दर्ज करें" : language === "kn" ? "ನಿಮ್ಮ ಇಮೆಯಿಲ್ ನಮೂದಿಸಿ" : "Enter your email"}
            onSubmit={(email) => console.log("Notify signup:", email)}
          />
        </div>
      </section>
    </div>
  );
}
