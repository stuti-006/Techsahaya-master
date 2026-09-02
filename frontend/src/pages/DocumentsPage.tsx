import { useEffect, useState } from "react";
import { FileCheck2, FileText, RefreshCcw, ShieldCheck, UploadCloud } from "lucide-react";
import { DotmHex4, DotMatrixLoaderModal } from "../components/ui/DotmHex4";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";
import { getLocalizedDocumentName } from "../utils/schemeLocalization";

const commonDocuments = [
  {
    documentType: "ration_card",
    name: { en: "Ration card", hi: "राशन कार्ड", kn: "ರೇಷನ್ ಕಾರ್ಡ್" },
    usedFor: {
      en: "Household income, family, food security and health-benefit checks",
      hi: "पारिवारिक आय, भोजन सुरक्षा और स्वास्थ्य लाभ की जांच के लिए",
      kn: "ಕುಟುಂಬದ ಆದಾಯ, ಆಹಾರ ಭದ್ರತೆ ಮತ್ತು ಆರೋಗ್ಯ ಸೌಲಭ್ಯ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
  {
    documentType: "income_certificate",
    name: { en: "Income certificate", hi: "आय प्रमाण पत्र", kn: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ" },
    usedFor: {
      en: "Scholarship, housing, LPG and low-income welfare checks",
      hi: "छात्रवृत्ति, आवास, एलपीजी और कम आय कल्याण की जांच के लिए",
      kn: "ವಿದ್ಯಾರ್ಥಿವೇತನ, ವಸತಿ ಮತ್ತು ಬಡತನ ರೇಖೆಯ ಸೌಲಭ್ಯ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
  {
    documentType: "land_record",
    name: { en: "Land record", hi: "भूमि रिकॉर्ड (RTC)", kn: "ಭೂ ದಾಖಲೆ (ಪಹಣಿ/RTC)" },
    usedFor: {
      en: "Farmer and agriculture benefit checks",
      hi: "किसान और कृषि संबंधी योजनाओं की जांच के लिए",
      kn: "ರೈತ ಮತ್ತು ಕೃಷಿ ಯೋಜನೆಗಳ ಅರ್ಹತೆ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
  {
    documentType: "bank_account_proof",
    name: { en: "Bank account proof", hi: "बैंक खाता प्रमाण", kn: "ಬ್ಯಾಂಕ್ ಖಾತೆ ಪುರಾವೆ" },
    usedFor: {
      en: "Benefit transfer readiness",
      hi: "प्रत्यक्ष लाभ अंतरण (DBT) की तैयारी के लिए",
      kn: "ನೇರ ಹಣ ವರ್ಗಾವಣೆ (DBT) ಸಿದ್ಧತೆಗಾಗಿ",
    },
  },
  {
    documentType: "residence_proof",
    name: { en: "Residence proof", hi: "निवास प्रमाण पत्र", kn: "ವಾಸಸ್ಥಳ ಪುರಾವೆ" },
    usedFor: {
      en: "State and district applicability checks",
      hi: "राज्य और जिला पात्रता की जांच के लिए",
      kn: "ರಾಜ್ಯ ಮತ್ತು ಜಿಲ್ಲಾ ಅರ್ಹತೆ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
  {
    documentType: "disability_certificate",
    name: { en: "Disability certificate", hi: "दिव्यांगता प्रमाण पत्र", kn: "ಅಂಗವಿಕಲತೆಯ ಪ್ರಮಾಣಪತ್ರ" },
    usedFor: {
      en: "Disability support and priority access checks",
      hi: "दिव्यांगता सहायता और प्राथमिकता पहुँच की जांच के लिए",
      kn: "ಅಂಗವಿಕಲರ ನೆರವು ಮತ್ತು ಆದ್ಯತೆಯ ಸೌಲಭ್ಯ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
  {
    documentType: "student_id",
    name: { en: "Student ID", hi: "छात्र पहचान पत्र", kn: "ವಿದ್ಯಾರ್ಥಿ ಐಡಿ ಕಾರ್ಡ್" },
    usedFor: {
      en: "Scholarship and education schemes",
      hi: "छात्रवृत्ति और शिक्षा संबंधी योजनाओं के लिए",
      kn: "ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಶಿಕ್ಷಣ ಯೋಜನೆಗಳಿಗಾಗಿ",
    },
  },
  {
    documentType: "birth_certificate",
    name: { en: "Birth certificate", hi: "जन्म प्रमाण पत्र", kn: "ಜನನ ಪ್ರಮಾಣಪತ್ರ" },
    usedFor: {
      en: "Age, child and girl-child scheme checks",
      hi: "आयु और बालिका सुरक्षा योजनाओं की जांच के लिए",
      kn: "ವಯಸ್ಸು ಮತ್ತು ಹೆಣ್ಣು ಮಗುವಿನ ಯೋಜನೆಗಳ ಪರಿಶೀಲನೆಗಾಗಿ",
    },
  },
];

export function DocumentsPage() {
  const { language, profile, setProfile } = useAppContext();
  const [documents, setDocuments] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await api.get("/api/documents");
    setDocuments(res.data);
  };

  useEffect(() => {
    load().catch(() => setDocuments([]));
  }, []);

  const langKey = language === "hi" ? "hi" : language === "kn" ? "kn" : "en";

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-6 shadow-card">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sahaya-saffron">{t(language, "processedSafely")}</p>
            <h1 className="mt-1 text-3xl font-bold">{t(language, "secureDocuments")}</h1>
            <p className="mt-2 max-w-3xl text-slate-600">{t(language, "documentsIntro")}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-sahaya-green">
            <ShieldCheck className="mb-2" />
            <b>{t(language, "documentPrivacyNote")}</b>
            <p className="mt-2 text-slate-700">{t(language, "doNotUploadIds")}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <div className="rounded-3xl bg-white p-5 shadow-card">
          <h2 className="mb-4 text-lg font-semibold">{t(language, "commonDocuments")}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {commonDocuments.map((item) => (
              <div key={item.documentType} className="rounded-2xl border p-4">
                <div className="flex items-center gap-2 font-semibold">
                  <FileCheck2 className="text-sahaya-green" size={18} /> {item.name[langKey]}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold">{t(language, "usedFor")}:</span> {item.usedFor[langKey]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-card" data-tour="upload-section">
          <h2 className="mb-2 text-lg font-semibold">{t(language, "uploadDocument")}</h2>
          <p className="mb-4 text-sm text-slate-600">{t(language, "uploadHelp")}</p>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const input = document.getElementById("upload") as HTMLInputElement;
              const file = input.files?.[0];
              if (!file) return;
              if (/aadhaar|aadhar|pan/i.test(file.name)) {
                setError(t(language, "doNotUploadIds"));
                return;
              }
              if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
                setError(t(language, "invalidDocumentType"));
                return;
              }
              if (file.size > 5242880) {
                setError(t(language, "documentTooLarge"));
                return;
              }
              try {
                setUploading(true);
                const form = new FormData();
                form.append("file", file);
                const res = await api.post("/api/documents/upload", form);
                setMessage(res.data.message);
                setProfile({ ...profile, available_documents: res.data.available_documents || profile.available_documents });
                setError("");
                input.value = "";
                await load();
              } catch {
                setError("Failed to upload document. Please try again.");
              } finally {
                setUploading(false);
              }
            }}
          >
            <div className="grid gap-1 text-sm font-semibold">
              <label htmlFor="doc-type">{t(language, "chooseDocument")}</label>
              <select
                id="doc-type"
                data-tour="doc-type-select"
                className="min-h-12 rounded-xl border p-3 font-normal text-slate-700 bg-white"
                defaultValue="income_certificate"
              >
                {commonDocuments.map((item) => (
                  <option key={item.documentType} value={item.documentType}>
                    {item.name[langKey]}
                  </option>
                ))}
              </select>
            </div>

            <label className="grid gap-1 text-sm font-semibold" htmlFor="upload">
              Select File (PDF, PNG, JPG)
              <input id="upload" aria-label={t(language, "uploadDocument")} className="min-h-12 rounded-xl border p-3 font-normal" type="file" accept=".pdf,.png,.jpg,.jpeg" />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={uploading}
                data-tour="upload-button"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-sahaya-green px-4 font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <DotmHex4 size={20} dotSize={3} color="#FFFFFF" /> Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} /> {t(language, "uploadDocument")}
                  </>
                )}
              </button>
              <button type="button" onClick={() => load()} className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 font-semibold hover:bg-stone-50 transition">
                <RefreshCcw size={18} /> {t(language, "refreshDocuments")}
              </button>
            </div>
          </form>
        </div>
      </section>

      {uploading && (
        <DotMatrixLoaderModal
          title="Processing Document Securely..."
          subtitle="Extracting masked metadata in memory — raw credentials are never retained"
        />
      )}

      {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="space-y-3 rounded-3xl bg-white p-5 shadow-card">
        {documents.length === 0 && <div className="rounded-xl border p-4 text-sm text-slate-600">{t(language, "noDocuments")}</div>}
        {documents.map((doc) => (
          <div key={doc.id} className="rounded-xl border p-4">
            <div className="flex items-center gap-2 font-semibold">
              <FileText size={18} /> {getLocalizedDocumentName(doc.document_type, language)}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {t(language, "documentStatus")}: {doc.status} | {t(language, "verification")}: {doc.verification_state}
            </div>
            <div className="mt-2 rounded-xl bg-stone-50 p-3 text-sm">
              {t(language, "maskedInfo")}: {JSON.stringify(doc.masked_fields)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
