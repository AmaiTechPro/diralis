import { motion } from "framer-motion";
import type { PreviewResult } from "../../types/preview";

interface Props {
  preview: PreviewResult;
  onClose: () => void;
}

export default function DatasetPreviewModal({
  preview,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">

      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
        }}
        animate={{
          opacity: 1,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          scale: 0.95,
        }}
        className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl"
      >

        <div className="flex items-center justify-between border-b border-slate-800 p-6">

          <div>

            <h2 className="text-2xl font-bold text-white">
              {preview.fileName}
            </h2>

            <p className="mt-2 text-slate-400">
              {preview.fileType.toUpperCase()} •{" "}
              {preview.rowCount.toLocaleString()} Rows •{" "}
              {preview.columnCount} Columns
            </p>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
          >
            Close
          </button>

        </div>

        <div className="overflow-auto p-6">

          <table className="min-w-full border-collapse">

            <thead>

              <tr>

                {preview.columns.map((column) => (
                  <th
                    key={column}
                    className="sticky top-0 border-b border-slate-700 bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-cyan-400"
                  >
                    {column}
                  </th>
                ))}

              </tr>

            </thead>

            <tbody>

              {preview.rows.map((row, index) => (

                <tr
                  key={index}
                  className="border-b border-slate-800 hover:bg-slate-800/50"
                >

                  {preview.columns.map((column) => (

                    <td
                      key={column}
                      className="px-4 py-3 text-sm text-slate-300"
                    >
                      {String(row[column] ?? "")}
                    </td>

                  ))}

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </motion.div>

    </div>
  );
}

