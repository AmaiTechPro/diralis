import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import FeatureGate from "../components/billing/FeatureGate";
import { useEntitlement } from "../hooks/useEntitlement";
import { FileText, Download, Sparkles, Layers, FileSpreadsheet } from "lucide-react";

export default function Reports() {
  const { currentTier, getLimit, getUsage } = useEntitlement();
  const [downloading, setDownloading] = useState<string | null>(null);

  const exportLimit = getLimit("monthlyExports");
  const exportUsage = getUsage("monthlyExports");

  async function handleDownload(format: string) {
    setDownloading(format);
    try {
      window.open(`/api/reports/generate?format=${format}`, "_blank");
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Business Reports</h1>
            <p className="mt-2 text-slate-400">
              Export comprehensive analytical summaries and executive PDFs.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <FileText size={15} className="text-cyan-400" />
              <span>
                Monthly Exports:{" "}
                <strong className="text-white">
                  {exportUsage}
                  {exportLimit !== null ? ` / ${exportLimit}` : " (Unlimited)"}
                </strong>
              </span>
            </div>
            <span className="h-4 w-px bg-slate-800" />
            <span className="text-[11px] font-semibold text-cyan-400">
              {currentTier} Plan
            </span>
          </div>
        </div>

        {/* Standard PDF Export Section (Starter+) */}
        <FeatureGate
          feature="exportPdf"
          minimumTier="STARTER"
          fallbackMode="blur"
          upgradeMessage="PDF Report generation is available on Starter, Pro, Business, and Custom plans."
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Executive PDF Summary</h3>
                  <p className="text-xs text-slate-400">
                    Full dataset health, metrics distribution, and AI recommendations.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleDownload("pdf")}
                disabled={downloading === "pdf"}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition disabled:opacity-50"
              >
                <Download size={14} />
                {downloading === "pdf" ? "Exporting..." : "Download PDF"}
              </button>
            </div>
          </div>
        </FeatureGate>

        {/* Advanced Batch & Excel Export (Pro+) */}
        <FeatureGate
          feature="exportExcel"
          minimumTier="PRO"
          fallbackMode="blur"
          upgradeMessage="Advanced Multi-sheet Excel & Batch forecasting exports require the PRO plan or higher."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Excel Analytical Workbook</h4>
                  <p className="text-xs text-slate-400">Cleaned sheets, formulas, and pivots.</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload("excel")}
                disabled={downloading === "excel"}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <Download size={13} /> Export .XLSX
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                  <Layers size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Batch Multi-Dataset Forecasts</h4>
                  <p className="text-xs text-slate-400">Aggregated projections across all tables.</p>
                </div>
              </div>
              <button
                onClick={() => handleDownload("batch")}
                disabled={downloading === "batch"}
                className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
              >
                <Sparkles size={13} /> Run Batch Export
              </button>
            </div>
          </div>
        </FeatureGate>
      </div>
    </AppLayout>
  );
}


