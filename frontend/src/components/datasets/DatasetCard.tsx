import {
  FileSpreadsheet,
  Eye,
  Trash2,
} from "lucide-react";

import type { Dataset } from "../../types/dataset";

interface Props {
  dataset: Dataset;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function DatasetCard({
  dataset,
  onPreview,
  onDelete,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all duration-300 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10">

      <div className="flex items-center gap-4">

        <div className="rounded-xl bg-cyan-500/20 p-3">
          <FileSpreadsheet
            className="text-cyan-400"
            size={28}
          />
        </div>

        <div>

          <h3 className="font-semibold text-white">
            {dataset.originalName}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {(dataset.size / 1024 / 1024).toFixed(2)} MB
            {" • "}
            {new Date(
              dataset.uploadedAt
            ).toLocaleDateString()}
          </p>

        </div>

      </div>

      <div className="flex items-center gap-2">

        <button
          onClick={() => onPreview(dataset.id)}
          className="rounded-lg p-2 text-cyan-400 transition-all hover:bg-cyan-500/10 hover:text-cyan-300"
          title="Preview Dataset"
        >
          <Eye size={18} />
        </button>

        <button
          onClick={() => onDelete(dataset.id)}
          className="rounded-lg p-2 text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          title="Delete Dataset"
        >
          <Trash2 size={18} />
        </button>

      </div>

    </div>
  );
}

