import { FileSpreadsheet } from "lucide-react";

interface UploadCardProps {
  file: File;
}

export default function UploadCard({
  file,
}: UploadCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500">

      <div className="flex items-center gap-4">

        <div className="rounded-xl bg-cyan-500/20 p-3">

          <FileSpreadsheet
            className="text-cyan-400"
            size={30}
          />

        </div>

        <div className="flex-1">

          <h3 className="font-semibold text-white">
            {file.name}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {(
              file.size /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>

        </div>

      </div>

    </div>
  );
}

