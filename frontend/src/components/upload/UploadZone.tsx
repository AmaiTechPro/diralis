import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
}

export default function UploadZone({
  onFileSelected,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
  } = useDropzone({
    onDrop,

    multiple: false,

    maxSize: 25 * 1024 * 1024,

    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        [".xlsx"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300

      ${
        isDragActive
          ? "border-cyan-400 bg-cyan-500/10"
          : "border-slate-700 hover:border-cyan-400 hover:bg-slate-900"
      }`}
    >
      <input {...getInputProps()} />

      <UploadCloud
        size={60}
        className="mx-auto text-cyan-400"
      />

      <h2 className="mt-6 text-2xl font-bold">
        Upload Dataset
      </h2>

      <p className="mt-3 text-slate-400">
        Drag & Drop your dataset here
      </p>

      <p className="mt-2 text-slate-500">
        or click to browse
      </p>

      <div className="mt-8 flex justify-center gap-6 text-sm text-slate-500">

        <span>CSV</span>

        <span>XLS</span>

        <span>XLSX</span>

      </div>

      <p className="mt-6 text-xs text-slate-600">
        Maximum file size: 25 MB
      </p>
    </div>
  );
}


