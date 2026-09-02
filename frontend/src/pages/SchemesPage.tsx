import { useMemo, useState } from "react";
import { SchemeCard } from "../components/SchemeCard";
import { ContinuousPagination } from "../components/ui/ContinuousPagination";
import { useAppContext } from "../context/AppContext";
import { t, type TranslationKey } from "../utils/i18n";
import { categoryTranslations, getLocalizedScheme } from "../utils/schemeLocalization";

const audienceFilters: Array<{ labelKey: TranslationKey; terms: string[] }> = [
  { labelKey: "farmers", terms: ["farmer", "agriculture", "land", "kisan", "किसान", "ರೈತ"] },
  { labelKey: "womenAndGirl", terms: ["women", "girl", "child", "ujjwala", "sukanya", "महिला", "ಮಹಿಳೆ"] },
  { labelKey: "students", terms: ["student", "scholarship", "education", "छात्र", "ವಿದ್ಯಾರ್ಥಿ"] },
  { labelKey: "disabilitiesGroup", terms: ["disability", "health", "support", "दिव्यांग", "ಅಂಗವಿಕಲ"] },
  { labelKey: "workersGroup", terms: ["worker", "labour", "shram", "occupation", "मजदूर", "ಕಾರ್ಮಿಕ"] },
  { labelKey: "familiesGroup", terms: ["family", "household", "health", "housing", "परिवार", "ಕುಟುಂಬ"] },
];

export function SchemesPage() {
  const { schemes, language } = useAppContext();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [state, setState] = useState("");
  const [audienceKey, setAudienceKey] = useState<TranslationKey | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [sortBy, setSortBy] = useState<"featured" | "name_asc" | "name_desc" | "verified_desc" | "category">("featured");

  const categories = useMemo(() => Array.from(new Set(schemes.map((scheme) => scheme.category))).sort(), [schemes]);
  const states = useMemo(() => Array.from(new Set(schemes.flatMap((scheme) => scheme.state_scope))).sort(), [schemes]);

  const filtered = useMemo(() => {
    setPage(1);
    const audienceTerms = audienceFilters.find((item) => item.labelKey === audienceKey)?.terms || [];
    const list = schemes.filter((scheme) => {
      const locScheme = getLocalizedScheme(scheme, language);
      const searchable = [
        locScheme.name,
        locScheme.description,
        locScheme.category,
        ...locScheme.eligibility,
        ...locScheme.benefits,
        ...locScheme.required_documents,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || searchable.includes(q.toLowerCase())) &&
        (!category || scheme.category === category) &&
        (!state || scheme.state_scope.includes("All") || scheme.state_scope.includes(state)) &&
        (!audienceTerms.length || audienceTerms.some((term) => searchable.includes(term)))
      );
    });

    // Sorting
    return list.sort((a, b) => {
      const locA = getLocalizedScheme(a, language);
      const locB = getLocalizedScheme(b, language);
      if (sortBy === "name_asc") return locA.name.localeCompare(locB.name);
      if (sortBy === "name_desc") return locB.name.localeCompare(locA.name);
      if (sortBy === "verified_desc") return String(b.last_verified || "").localeCompare(String(a.last_verified || ""));
      if (sortBy === "category") return locA.category.localeCompare(locB.category);
      return 0;
    });
  }, [schemes, q, category, state, audienceKey, language, sortBy]);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sahaya-saffron">{t(language, "schemeDiscovery")}</p>
            <h1 className="mt-1 text-2xl font-bold text-sahaya-ink md:text-3xl">{t(language, "schemeDiscoveryTitle")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{t(language, "schemeDiscoverySubtitle")}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-sahaya-green">
            {filtered.length} {t(language, "matchingSchemes")}
          </div>
        </div>
      </section>

      <div className="rounded-3xl bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold">
            {t(language, "search")}
            <input
              className="min-h-12 rounded-xl border p-3 font-normal"
              placeholder={t(language, "searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t(language, "category")}
            <select className="min-h-12 rounded-xl border p-3 font-normal" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">{t(language, "allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryTranslations[cat]?.[language === "hi" ? "hi" : language === "kn" ? "kn" : "hi"] || cat}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t(language, "state")}
            <select className="min-h-12 rounded-xl border p-3 font-normal" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">{t(language, "allIndiaAndStates")}</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st === "All" ? (language === "hi" ? "सभी राज्य" : language === "kn" ? "ಎಲ್ಲಾ ರಾಜ್ಯಗಳು" : "All India") : st === "Karnataka" ? (language === "hi" ? "कर्नाटक" : language === "kn" ? "ಕರ್ನಾಟಕ" : "Karnataka") : st}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t(language, "citizenGroup")}
            <select className="min-h-12 rounded-xl border p-3 font-normal" value={audienceKey} onChange={(e) => setAudienceKey(e.target.value as TranslationKey)}>
              <option value="">{t(language, "everyone")}</option>
              {audienceFilters.map((item) => (
                <option key={item.labelKey} value={item.labelKey}>
                  {t(language, item.labelKey)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {audienceFilters.map((item) => (
            <button
              key={item.labelKey}
              type="button"
              onClick={() => setAudienceKey(audienceKey === item.labelKey ? "" : item.labelKey)}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold ${audienceKey === item.labelKey ? "border-sahaya-green bg-sahaya-green text-white" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {t(language, item.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting & Items Per Page Controls (as in inspiration design) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-xs">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Showing <span className="text-[#1A3D2E] font-extrabold">{Math.min(filtered.length, (page - 1) * pageSize + 1)}–{Math.min(filtered.length, page * pageSize)}</span> of <span className="text-[#1A3D2E] font-extrabold">{filtered.length}</span> schemes
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* ITEMS PER PAGE */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
              ITEMS PER PAGE
            </span>
            <select
              aria-label="Items per page"
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-xs focus:border-[#1A3D2E] focus:outline-none"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* SORT BY */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-800">
              SORT BY
            </span>
            <select
              aria-label="Sort schemes by"
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 shadow-xs focus:border-[#1A3D2E] focus:outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="featured">Featured</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
              <option value="verified_desc">Recently Verified</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {filtered.slice((page - 1) * pageSize, page * pageSize).map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
          <ContinuousPagination
            totalPages={Math.ceil(filtered.length / pageSize)}
            currentPage={page}
            onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
        </>
      ) : (
        <div className="rounded-3xl border border-dashed bg-white p-8 text-center shadow-card">
          <h2 className="text-xl font-semibold">{t(language, "noSchemes")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{t(language, "noSchemesHelp")}</p>
          <button
            onClick={() => {
              setQ("");
              setCategory("");
              setState("");
              setAudienceKey("");
            }}
            className="mt-4 min-h-12 rounded-xl bg-sahaya-green px-5 font-semibold text-white"
          >
            {t(language, "clearFilters")}
          </button>
        </div>
      )}
    </div>
  );
}
