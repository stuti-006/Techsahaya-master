import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "../components/ProfileForm";
import { EmojiSpreeChips, type InterestItem } from "../components/ui/EmojiSpreeChips";
import { api } from "../services/api";
import { useAppContext } from "../context/AppContext";

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

export function ProfileSetupPage() {
  const { profile, setProfile, language } = useAppContext();
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card">
      <h1 className="text-3xl font-bold">
        {language === "hi" ? "प्रोफ़ाइल सेटअप" : language === "kn" ? "ಪ್ರೊಫೈಲ್ ಸೆಟಪ್" : "Profile Setup"}
      </h1>
      <p className="mt-2 text-slate-600">
        {language === "hi"
          ? "पात्रता और सुझावों के लिए केवल आवश्यक जानकारी भरें।"
          : language === "kn"
          ? "ಅರ್ಹತೆ ಮತ್ತು ಶಿಫಾರಸುಗಳಿಗಾಗಿ ಅಗತ್ಯ ಮಾಹಿತಿಯನ್ನು ಮಾತ್ರ ತುಂಬಿ."
          : "Complete only the information needed for eligibility and recommendations."}
      </p>

      {/* Interest chips */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-stone-50 p-4">
        <p className="mb-1 text-sm font-bold text-sahaya-green">
          {language === "hi" ? "आप किस क्षेत्र में लाभ खोज रहे हैं?" : language === "kn" ? "ನೀವು ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ ಲಾಭ ಹುಡುಕುತ್ತಿದ್ದೀರಿ?" : "What areas are you looking for benefits in?"}
        </p>
        <p className="mb-4 text-xs text-slate-500">
          {language === "hi" ? "जितने चाहें उतने चुनें — drag करके और देखें" : language === "kn" ? "ಬೇಕಾದಷ್ಟು ಆಯ್ಕೆ ಮಾಡಿ — ಎಳೆದು ಹೆಚ್ಚು ನೋಡಿ" : "Pick as many as you like — drag to see more"}
        </p>
        <EmojiSpreeChips
          interests={CITIZEN_INTERESTS}
          selected={selectedInterests}
          onChange={setSelectedInterests}
        />
      </div>

      <div className="mt-6">
        <ProfileForm
          initialValue={profile}
          submitLabel={
            language === "hi" ? "सेव करें और आगे बढ़ें" : language === "kn" ? "ಉಳಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ" : "Save and continue"
          }
          onSubmit={async (nextProfile) => {
            setProfile(nextProfile);
            await api.put("/api/profile", {
              ...nextProfile,
              preferred_language: language,
              consent_given: true,
              interests: selectedInterests,
            });
            navigate("/dashboard");
          }}
        />
      </div>
    </div>
  );
}
