interface UploadProgressProps {
  progress: number;
}

export default function UploadProgress({
  progress,
}: UploadProgressProps) {
  return (
    <div className="mt-6">

      <div className="mb-2 flex justify-between text-sm">

        <span>Uploading...</span>

        <span>{progress}%</span>

      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-cyan-500 transition-all duration-300"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>

    </div>
  );
}

