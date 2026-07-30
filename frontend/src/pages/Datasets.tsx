import { useEffect, useState } from "react";

import AppLayout from "../components/layout/AppLayout";
import UploadZone from "../components/upload/UploadZone";
import UploadCard from "../components/upload/UploadCard";
import UploadProgress from "../components/upload/UploadProgress";

import DatasetCard from "../components/datasets/DatasetCard";
import DatasetPreviewModal from "../components/datasets/DatasetPreviewModal";

import AnalyticsModal from "../components/analytics/AnalyticsModal";

import { uploadDataset } from "../api/upload";
import { fetchDatasets } from "../api/dataset";
import { deleteDataset } from "../api/deleteDataset";
import { previewDataset } from "../api/previewDataset";
import { getDatasetProfile } from "../api/profile";

import type { Dataset } from "../types/dataset";
import type { PreviewResult } from "../types/preview";
import type { DatasetProfile } from "../types/profile";

export default function Datasets() {
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [datasets, setDatasets] =
    useState<Dataset[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const [preview, setPreview] =
    useState<PreviewResult | null>(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const [analyticsOpen, setAnalyticsOpen] =
    useState(false);

  const [analyticsLoading, setAnalyticsLoading] =
    useState(false);

  const [profile, setProfile] =
    useState<DatasetProfile | null>(null);

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

    setUploading(true);
    setProgress(0);
    setSuccess("");
    setError("");

    const timer = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) {
          return current;
        }

        return current + 10;
      });
    }, 200);

    try {
      const result =
        await uploadDataset(selectedFile);

      clearInterval(timer);

      setProgress(100);

      setSuccess(result.message);

      setSelectedFile(null);

      await loadDatasets();

      setTimeout(() => {
        setProgress(0);
      }, 800);

    } catch (err) {
      clearInterval(timer);

      setProgress(0);

      setError(
        err instanceof Error
          ? err.message
          : "Upload failed."
      );

    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(
    id: string
  ) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this dataset?"
    );

    if (!confirmed) return;

    try {
      await deleteDataset(id);

      setSuccess(
        "Dataset deleted successfully."
      );

      await loadDatasets();

    } catch (err) {
      console.error(err);

      setError(
        "Failed to delete dataset."
      );
    }
  }

  async function handlePreview(
    id: string
  ) {
    try {
      setPreviewLoading(true);

      const data =
        await previewDataset(id);

      setPreview(data);

    } catch (err) {
      console.error(err);

      setError(
        "Failed to load dataset preview."
      );

    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAnalyze(
    id: string
  ) {
    try {
      setAnalyticsOpen(true);

      setAnalyticsLoading(true);

      const result =
        await getDatasetProfile(id);

      setProfile(result);

    } catch (err) {
      console.error(err);

      setProfile(null);

      setError(
        "Failed to generate dataset analytics."
      );

    } finally {
      setAnalyticsLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-10">

        <div>

          <h1 className="text-4xl font-bold">
            Datasets
          </h1>

          <p className="mt-3 text-slate-400">
            Upload and manage your datasets
            for AI-powered analysis.
          </p>

        </div>

        <UploadZone
          onFileSelected={
            setSelectedFile
          }
        />

        {selectedFile && (
          <div className="space-y-5">

            <UploadCard
              file={selectedFile}
            />

            {uploading && (
              <UploadProgress
                progress={progress}
              />
            )}

            <button
              onClick={
                handleUpload
              }
              disabled={
                uploading
              }
              className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : "Upload Dataset"}
            </button>

          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-600 bg-green-600/10 p-4 text-green-400">
            ✅ {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-600 bg-red-600/10 p-4 text-red-400">
            ❌ {error}
          </div>
        )}

        {previewLoading && (
          <div className="rounded-xl border border-cyan-600 bg-cyan-500/10 p-4 text-cyan-400">
            📄 Loading dataset preview...
          </div>
        )}

        <div className="space-y-4">

          <h2 className="text-2xl font-semibold">
            My Datasets
          </h2>

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
          onClose={() =>
            setPreview(null)
          }
        />
      )}

      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setProfile(null);
        }}
        loading={analyticsLoading}
        profile={profile}
      />

    </AppLayout>
  );
}

