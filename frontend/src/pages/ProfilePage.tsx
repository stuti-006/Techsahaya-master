import { useEffect, useState } from "react";
import { ProfileForm } from "../components/ProfileForm";
import { SectionCard } from "../components/SectionCard";
import { TimedUndoAction } from "../components/ui/TimedUndoAction";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";

const friendlyFieldNames: Record<string, Record<string, string>> = {
  full_name: { en: "Name", hi: "नाम", kn: "ಹೆಸರು" },
  email: { en: "Email", hi: "ईमेल", kn: "ಇಮೇಲ್" },
  phone_number: { en: "Phone number", hi: "फोन नंबर", kn: "ಫೋನ್ ಸಂಖ್ಯೆ" },
  preferred_language: { en: "Preferred language", hi: "पसंदीदा भाषा", kn: "ಆದ್ಯತೆಯ ಭಾಷೆ" },
  accessibility_preference: { en: "Accessibility preference", hi: "सुगमता विकल्प", kn: "ಪ್ರವೇಶಿಸುವಿಕೆ ಆಯ್ಕೆ" },
  consent_given: { en: "Consent status", hi: "सहमति स्थिति", kn: "ಸಮ್ಮತಿ ಸ್ಥಿತಿ" },
  age: { en: "Age", hi: "आयु", kn: "ವಯಸ್ಸು" },
  gender: { en: "Gender", hi: "लिंग", kn: "ಲಿಂಗ" },
  state: { en: "State", hi: "राज्य", kn: "ರಾಜ್ಯ" },
  occupation: { en: "Occupation", hi: "व्यवसाय", kn: "ಉದ್ಯೋಗ" },
  income: { en: "Income range", hi: "आय सीमा", kn: "ಆದಾಯ ಪ್ರಮಾಣ" },
  landholding: { en: "Landholding", hi: "भूमि", kn: "ಜಮೀನು" },
  disability: { en: "Disability support need", hi: "दिव्यांगता सहायता", kn: "ಅಂಗವಿಕಲರ ನೆರವು" },
  family_members: { en: "Family members", hi: "परिवार सदस्य", kn: "ಕುಟುಂಬ ಸದಸ್ಯರು" },
  available_documents: { en: "Available document names", hi: "उपलब्ध दस्तावेज़", kn: "ಲಭ್ಯವಿರುವ ದಾಖಲೆಗಳು" },
  recently_viewed_schemes: { en: "Recently viewed schemes", hi: "हाल ही में देखी गई योजनाएँ", kn: "ಇತ್ತೀಚೆಗೆ ನೋಡಿದ ಯೋಜನೆಗಳು" },
  digital_literacy: { en: "Guidance preference", hi: "मार्गदर्शन विकल्प", kn: "ಮಾರ್ಗದರ್ಶನ ಆದ್ಯತೆ" },
};

const neverStoredItems: Record<string, string[]> = {
  en: ["Full Aadhaar number", "Full PAN number", "Biometric data", "Raw identity documents"],
  hi: ["पूरा आधार नंबर", "पूरा पैन नंबर", "बायोमेट्रिक डेटा", "मूल पहचान पत्र की तस्वीर"],
  kn: ["ಪೂರ್ಣ ಆಧಾರ್ ಸಂಖ್ಯೆ", "ಪೂರ್ಣ ಪ್ಯಾನ್ ಸಂಖ್ಯೆ", "ಬಯೋಮೆಟ್ರಿಕ್ ಡೇಟಾ", "ಮೂಲ ಗುರುತಿನ ಚೀಟಿಯ ಚಿತ್ರ"],
};

export function ProfilePage() {
  const { profile, setProfile, language, setLanguage } = useAppContext();
  const [storedSummary, setStoredSummary] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/api/profile").then((res) => setStoredSummary(res.data.stored_data_summary)).catch(() => undefined);
  }, []);

  const langKey = language === "hi" ? "hi" : language === "kn" ? "kn" : "en";

  const fieldsStored = (storedSummary?.fields_stored || []).map((field: string) => friendlyFieldNames[field]?.[langKey] || field);
  const neverStored = neverStoredItems[langKey] || neverStoredItems.en;

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
      <SectionCard title={t(language, "profilePrivacy")}>
        <div data-tour="profile-header" className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="text-lg font-semibold text-sahaya-green">{t(language, "tellOnlyNeeded")}</div>
          <p className="mt-1 text-sm text-slate-700">{t(language, "profileHelp")}</p>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold" htmlFor="profile-language">{t(language, "language")}</label>
          <select id="profile-language" className="min-h-12 rounded-xl border p-3" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="kn">Kannada</option>
          </select>
        </div>
        <ProfileForm
          initialValue={profile}
          submitLabel={t(language, "saveProfile")}
          onSubmit={async (nextProfile) => {
            setProfile(nextProfile);
            await api.put("/api/profile", { ...nextProfile, preferred_language: language, consent_given: true });
            setMessage(t(language, "profileSaved"));
          }}
        />
      </SectionCard>

      <SectionCard title={t(language, "storedDataControls")}>
        <p className="text-sm leading-6 text-slate-600">{t(language, "minimumData")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold">{t(language, "whatMayBeStored")}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {fieldsStored.map((field: string) => (
                <span key={field} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-medium text-slate-700">
                  {field}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <h3 className="font-semibold text-red-900">{t(language, "whatNeverStored")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-red-950">
              {neverStored.map((item: string) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-slate-700">
            {storedSummary?.sensitive_data_policy ||
              (language === "hi"
                ? "दस्तावेज़ केवल प्रक्रिया के दौरान उपयोग होते हैं, केवल मास्क्ड फ़ील्ड सहेजे जाते हैं।"
                : language === "kn"
                ? "ದಾಖಲೆಗಳನ್ನು ಸಂಸ್ಕರಣೆಯ ಸಮಯದಲ್ಲಿ ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ, ಮಾಸ್ಕ್ ಮಾಡಿದ ಮಾಹಿತಿ ಮಾತ್ರ ಉಳಿಯುತ್ತದೆ."
                : "Documents are processed in memory whenever possible and only masked extracted metadata is retained.")}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-red-200 p-4">
          <h3 className="font-semibold text-red-900">{t(language, "deletePersonalData")}</h3>
          <p className="mt-1 text-sm text-slate-600">{t(language, "typeDeleteHelp")}</p>
          <div className="mt-4">
            <TimedUndoAction
              deleteLabel={language === "hi" ? "मेरा पूरा डेटा हटाएं" : language === "kn" ? "ನನ್ನ ಎಲ್ಲಾ ಡೇಟಾ ಅಳಿಸಿ" : "Delete All My Data"}
              undoLabel={language === "hi" ? "रद्द करें" : language === "kn" ? "ರದ್ದು ಮಾಡಿ" : "Cancel Delete"}
              initialSeconds={8}
              onConfirmedDelete={async () => {
                await api.delete("/api/profile");
                setProfile({ available_documents: [] });
                setMessage(t(language, "allDataDeleted"));
              }}
            />
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-sahaya-green">{message}</p>}
      </SectionCard>
    </div>
  );
}
