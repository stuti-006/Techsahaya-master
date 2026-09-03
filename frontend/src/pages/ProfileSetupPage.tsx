import { Sparkles, UserCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "../components/ProfileForm";
import { EmojiSpreeChips, type InterestItem } from "../components/ui/EmojiSpreeChips";
import { api } from "../services/api";
import { useAppContext } from "../context/AppContext";
import type { EligibilityProfile } from "../types";

const CITIZEN_INTERESTS: InterestItem[] = [
  { id: "farmer", label: "Farmer", emoji: "🌾" },
  { id: "student", label: "Student", emoji: "🎓" },
  { id: "women", label: "Women welfare", emoji: "👩" },
  { id: "worker", label: "Worker", emoji: "🏗️" },
  { id: "senior", label: "Senior citizen", emoji: "🧓" },
  { id: "disability", label: "Disability support", emoji: "♿" },
  { id: "housing", label: "Housing", emoji: "🏠" },
  { id: "health", label: "Health schemes", emoji: "🏥" },
  { id: "family", label: "Family welfare", emoji: "👨‍👩‍👧" },
  { id: "business", label: "Small business", emoji: "🏪" },
  { id: "tribal", label: "Tribal welfare", emoji: "🌿" },
  { id: "bpl", label: "BPL / Low income", emoji: "💸" },
];

const PRESET_PERSONAS = [
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
    interests: ["farmer", "bpl", "housing"],
  },
  {
    key: "student",
    emoji: "🎓",
    title: "College Student",
    desc: "Age 20, Karnataka, Student, ₹1.5L family income",
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
    interests: ["student", "women"],
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
    interests: ["women", "business", "bpl", "health"],
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
    interests: ["worker", "housing", "health", "bpl"],
  },
];

export function ProfileSetupPage() {
  const { profile, setProfile, language, refreshProfile } = useAppContext();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const handleSelectPreset = (preset: typeof PRESET_PERSONAS[0]) => {
    setActivePreset(preset.key);
    setProfile(preset.profile);
    setSelectedInterests(preset.interests);
  };

  return (
    <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-card border border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === "hi" ? "नागरिक प्रोफ़ाइल सेटअप" : language === "kn" ? "ನಾಗರಿಕ ಪ್ರೊಫೈಲ್ ಸೆಟಪ್" : "Citizen Profile Setup"}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            {language === "hi"
              ? "सटीक सरकारी योजनाएं और लाभ खोजने के लिए अपनी जानकारी भरें या 1-क्लिक प्रीसेट चुनें।"
              : language === "kn"
              ? "ನಿಖರವಾದ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ಪ್ರಯೋಜನಗಳನ್ನು ಹುಡುಕಲು ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಭರ್ತಿ ಮಾಡಿ ಅಥವಾ 1-ಕ್ಲಿಕ್ ಪೂರ್ವನಿಗದಿಯನ್ನು ಆರಿಸಿ."
              : "Fill in your demographic details or choose a 1-click starter persona to immediately calculate your welfare benefits."}
          </p>
        </div>
      </div>

      {/* Quick Start Personas */}
      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#164E35]">
          <Sparkles size={16} className="text-[#FF4365]" />
          <span>Quick 1-Click Starter Personas (Fill Instantly)</span>
        </div>
        <p className="mt-1 text-xs text-slate-600 mb-3">
          Click any persona below to auto-populate the form with typical citizen attributes:
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PRESET_PERSONAS.map((p) => {
            const isSelected = activePreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition cursor-pointer ${
                  isSelected
                    ? "border-[#164E35] bg-white ring-2 ring-[#164E35]/20 shadow-xs"
                    : "border-emerald-200/80 bg-white hover:border-[#164E35] hover:bg-emerald-50/30"
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-2xl">{p.emoji}</span>
                  {isSelected && <UserCheck size={16} className="text-[#164E35]" />}
                </div>
                <span className="mt-2 text-xs font-bold text-slate-900">{p.title}</span>
                <span className="mt-0.5 text-[11px] text-slate-500 leading-tight">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interest chips */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-stone-50 p-4 sm:p-5">
        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#164E35]">
          {language === "hi" ? "योजना श्रेणियां (वैकल्पिक)" : language === "kn" ? "ಯೋಜನೆ ವರ್ಗಗಳು (ಐಚ್ಛಿಕ)" : "Welfare Focus Areas"}
        </p>
        <p className="mb-4 text-xs text-slate-500">
          {language === "hi" ? "जितने चाहें उतने चुनें — drag करके और देखें" : language === "kn" ? "ಬೇಕಾದಷ್ಟು ಆಯ್ಕೆ ಮಾಡಿ — ಎಳೆದು ಹೆಚ್ಚು ನೋಡಿ" : "Select key domains of interest for custom recommendations:"}
        </p>
        <EmojiSpreeChips
          interests={CITIZEN_INTERESTS}
          selected={selectedInterests}
          onChange={setSelectedInterests}
        />
      </div>

      {/* Profile Form */}
      <div className="mt-6">
        <ProfileForm
          initialValue={profile}
          submitLabel={
            language === "hi" ? "सेव करें और डैशबोर्ड देखें" : language === "kn" ? "ಉಳಿಸಿ ಮತ್ತು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ" : "Save Profile & View Eligible Schemes"
          }
          onSubmit={async (nextProfile) => {
            setProfile(nextProfile);
            await api.put("/api/profile", {
              ...nextProfile,
              preferred_language: language,
              consent_given: true,
              interests: selectedInterests,
            });
            await refreshProfile();
            navigate("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
