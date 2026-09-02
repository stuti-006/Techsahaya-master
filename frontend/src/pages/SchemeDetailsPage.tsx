import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SectionCard } from "../components/SectionCard";
import { SaveToggle } from "../components/ui/SaveToggle";
import { useAppContext } from "../context/AppContext";
import { api } from "../services/api";
import { t } from "../utils/i18n";
import { getLocalizedScheme } from "../utils/schemeLocalization";

export function SchemeDetailsPage() {
  const { schemeId } = useParams();
  const { language } = useAppContext();
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    api.get(`/api/schemes/${schemeId}`).then((res) => setData(res.data)).catch(() => setData(null));
  }, [schemeId]);

  if (!data) return <p className="p-4 text-sm text-slate-600">{t(language, "loadingAnswer")}</p>;

  const scheme = getLocalizedScheme(data.scheme, language);

  return (
    <div className="space-y-4">
      <SectionCard title={scheme.name}>
        <p className="leading-relaxed text-slate-700">{scheme.description}</p>
        <p className="mt-3 text-sm font-medium text-slate-600">
          <span className="font-semibold">{t(language, "category")}:</span> {scheme.category} | <span className="font-semibold">{t(language, "coverage")}:</span> {scheme.state_scope.join(", ")}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{t(language, "verificationStatus")}:</span> {t(language, "lastVerified")} {scheme.last_verified}
        </p>
        <p className="text-sm text-slate-600">
          <span className="font-semibold">{t(language, "department")}:</span> {scheme.department}
        </p>
        {data.conflicts && data.conflicts.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{data.conflicts[0]}</div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link to="/eligibility" className="inline-flex min-h-12 items-center rounded-xl bg-sahaya-green px-4 font-semibold text-white">
            {t(language, "checkMyEligibility")}
          </Link>
          <SaveToggle
            idleText={t(language, "saveScheme")}
            savedText={t(language, "saved")}
            onSave={() => api.post("/api/schemes/save", { scheme_id: scheme.id })}
          />
          <a href={String(scheme.official_link)} target="_blank" className="inline-flex min-h-12 items-center rounded-xl border px-4 font-semibold" rel="noreferrer">
            {t(language, "officialSource")} →
          </a>
        </div>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title={t(language, "benefitsForYou")}>
          <ul className="space-y-2 text-sm text-slate-700">
            {scheme.benefits.map((item: string) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-sahaya-green font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t(language, "eligibility")}>
          <ul className="space-y-2 text-sm text-slate-700">
            {scheme.eligibility.map((item: string) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-sahaya-green font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t(language, "requiredDocuments")}>
          <ul className="space-y-2 text-sm text-slate-700">
            {scheme.required_documents.map((item: string) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-sahaya-green font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t(language, "applicationSteps")}>
          <ol className="space-y-2 text-sm text-slate-700">
            {scheme.application_steps.map((item: string, idx: number) => (
              <li key={item} className="flex items-start gap-2">
                <span className="font-bold text-sahaya-green">{idx + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </SectionCard>

        <SectionCard title={t(language, "evidenceSource")}>
          <div className="space-y-1 text-sm text-slate-700">
            <div><span className="font-semibold">{t(language, "officialSource")}:</span> {scheme.source_name}</div>
            <div><span className="font-semibold">{t(language, "lastVerified")}:</span> {scheme.last_verified}</div>
            <div className="mt-2 text-xs text-slate-600">{scheme.source_reference}</div>
          </div>
        </SectionCard>

        <SectionCard title={t(language, "alternatives")}>
          {scheme.alternative_scheme_ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {scheme.alternative_scheme_ids.map((item: string) => (
                <Link key={item} to={`/schemes/${item}`} className="rounded-lg border bg-stone-50 px-3 py-1.5 text-xs font-semibold text-sahaya-green">
                  {item}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">{t(language, "none")}</p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
