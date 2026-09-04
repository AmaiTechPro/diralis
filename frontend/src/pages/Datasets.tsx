import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database } from "lucide-react";

import UploadZone from "../components/upload/UploadZone";
import UploadCard from "../components/upload/UploadCard";
import UploadProgress from "../components/upload/UploadProgress";
import DatasetCard from "../components/datasets/DatasetCard";
import DatasetPreviewModal from "../components/datasets/DatasetPreviewModal";
import AnalyticsModal from "../components/analytics/AnalyticsModal";
import FeatureGate from "../components/billing/FeatureGate";
import { useEntitlement } from "../hooks/useEntitlement";

import { uploadDataset } from "../api/upload";
import { fetchDatasets } from "../api/dataset";
import { deleteDataset } from "../api/deleteDataset";
import { previewDataset } from "../api/previewDataset";
import { getDatasetProfile } from "../api/profile";

import type { Dataset } from "../types/dataset";
import type { PreviewResult } from "../types/preview";
import type { DatasetProfile } from "../types/profile";

function refreshDashboard() {
  window.dispatchEvent(new Event("dashboard-refresh"));
}

export default function Datasets() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);

  const { getLimit, getUsage, isUsageExceeded, currentTier, refresh: refreshEntitlements } = useEntitlement();

  const datasetLimit = getLimit("datasets");
  const datasetUsage = getUsage("datasets") || datasets.length;
  const isLimitReached = isUsageExceeded("datasets");

  async function loadDatasets() {
    try {
      const data = await fetchDatasets();
      setDatasets(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  async function handleUpload() {
    if (!selectedFile) return;

    if (isLimitReached) {
      setError(`Upload blocked: You have reached the maximum allowed dataset limit (${datasetLimit}) for your plan.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setSuccess("");
    setError("");

    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        return current + 10;
      });
    }, 200);

    try {
      const result = await uploadDataset(selectedFile);
      clearInterval(timer);
      setProgress(100);
      setSuccess(result.message);
      setSelectedFile(null);

      await loadDatasets();
      await refreshEntitlements();
      refreshDashboard();

      setTimeout(() => {
        setProgress(0);
      }, 800);
    } catch (err) {
      clearInterval(timer);
      setProgress(0);
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this dataset?");
    if (!confirmed) return;

    try {
      await deleteDataset(id);
      setSuccess("Dataset deleted successfully.");
      await loadDatasets();
      await refreshEntitlements();
      refreshDashboard();
    } catch (err) {
      console.error(err);
      setError("Failed to delete dataset.");
    }
  }

  async function handlePreview(id: string) {
    try {
      setPreviewLoading(true);
      const data = await previewDataset(id);
      setPreview(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load dataset preview.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAnalyze(id: string) {
    try {
      setProfile(null);
      setAnalyticsError(null);
      setAnalyticsOpen(true);
      setAnalyticsLoading(true);
      const result = await getDatasetProfile(id);
      setProfile(result);
    } catch (err) {
      console.error(err);
      setProfile(null);
      setAnalyticsError(
        err instanceof Error ? err.message : "Failed to load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Datasets</h1>
            <p className="mt-2 text-slate-400">
              Upload and manage your datasets for AI-powered analysis.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Database size={15} className="text-cyan-400" />
              <span>
                Datasets:{" "}
                <strong className="text-white">
                  {datasetUsage}
                  {datasetLimit !== null ? ` / ${datasetLimit}` : " (Unlimited)"}
                </strong>
              </span>
            </div>
            <span className="h-4 w-px bg-slate-800" />
            <Link
              to="/billing"
              className="text-[11px] font-semibold text-cyan-400 hover:underline"
            >
              Plan: {currentTier}
            </Link>
          </div>
        </div>

        {isLimitReached && (
          <FeatureGate
            resourceLimit="datasets"
            fallbackMode="banner"
            upgradeMessage={`You have reached your limit of ${datasetLimit} datasets on the ${currentTier} plan. Upgrade to upload more datasets.`}
          >
            <div />
          </FeatureGate>
        )}

        <UploadZone onFileSelected={setSelectedFile} />

        {selectedFile && (
          <div className="space-y-5">
            <UploadCard file={selectedFile} />

            {uploading && <UploadProgress progress={progress} />}

            <button
              onClick={handleUpload}
              disabled={uploading || isLimitReached}
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : isLimitReached
                ? "Dataset Limit Reached"
                : "Upload Dataset"}
            </button>
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-600/30 bg-green-600/10 p-4 text-green-400">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-600/30 bg-red-600/10 p-4 text-red-400">
            ❌ {error}
          </div>
        )}

        {previewLoading && (
          <div className="rounded-xl border border-cyan-600/30 bg-cyan-500/10 p-4 text-cyan-400">
            📄 Loading dataset preview...
          </div>
        )}

        {/* pb-36 provides vertical clearance past the floating WhatsApp button */}
        <div className="space-y-4 pb-36">
          <h2 className="text-2xl font-semibold">My Datasets</h2>

          {datasets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
              No datasets uploaded yet.
            </div>
          ) : (
            datasets.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onPreview={handlePreview}
                onAnalyze={handleAnalyze}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {preview && (
        <DatasetPreviewModal
          preview={preview}
          onClose={() => setPreview(null)}
        />
      )}

      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setProfile(null);
          setAnalyticsError(null);
        }}
        loading={analyticsLoading}
        profile={profile}
        error={analyticsError}
      />
    </>
  );
}

