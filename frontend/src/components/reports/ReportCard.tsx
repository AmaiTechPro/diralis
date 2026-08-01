{/* eslint-disable @typescript-eslint/no-unused-vars 


import { useState } from "react";
import { downloadReport } from "../../services/reportDownloadService";


interface ReportCardProps {
  title: string;
  description: string;
  icon: string;
  section: string;
}


export default function ReportCard({
  title,
  description,
  icon,
  section,
}: ReportCardProps) {

  const [loading, setLoading] = useState(false);


  const handleGenerate = async () => {

    try {

      setLoading(true);

      await downloadReport(section);

    } catch (error) {

      console.error(
        "Report generation failed:",
        error
      );

    } finally {

      setLoading(false);

    }

  };


  return (
    <div
      className="
        rounded-3xl
        bg-slate-950
        p-8
        shadow-lg
        space-y-6
      "
    >

      <div className="text-5xl">
        {icon}
      </div>


      <h2
        className="
          text-2xl
          font-bold
          text-white
        "
      >
        {title}
      </h2>


      <p
        className="
          text-slate-400
          leading-relaxed
        "
      >
        {description}
      </p>


      <button
        onClick={handleGenerate}
        disabled={loading}
        className="
          rounded-xl
          bg-cyan-500
          px-6
          py-3
          font-medium
          text-slate-950
          transition
          hover:bg-cyan-400
          disabled:opacity-50
        "
      >

        {loading
          ? "Generating..."
          : "Generate Report"}

      </button>


    </div>
  );
}

  {/* New ReportCard component created to handle individual report cards with their own loading state and download functionality. Each card now has a title, description, icon, and section prop to customize its content. The handleGenerate function manages the report generation process and provides feedback to the user. */}

{/* New ReportCard component created to handle individual report cards with their own loading state and download functionality. Each card now has a title, description, icon, and section prop to customize its content. The handleGenerate function manages the report generation process and provides feedback to the user. */}

import { useState } from "react";
import { downloadReport } from "../../services/reportDownloadService";


interface ReportCardProps {
  title: string;
  description: string;
  icon: string;
  section: string;
}


export default function ReportCard({
  title,
  description,
  icon,
  section,
}: ReportCardProps) {

  const [loading, setLoading] = useState(false);


  const handleGenerate = async () => {
    try {
      setLoading(true);

      await downloadReport(section);

    } catch (error) {
      console.error(
        "Report generation failed:",
        error
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="
        rounded-3xl
        bg-slate-950
        p-8
        shadow-lg
        space-y-6
      "
    >

      <div className="text-5xl">
        {icon}
      </div>


      <h2
        className="
          text-2xl
          font-bold
          text-white
        "
      >
        {title}
      </h2>


      <p
        className="
          text-slate-400
          leading-relaxed
        "
      >
        {description}
      </p>


      <button
        onClick={handleGenerate}
        disabled={loading}
        className="
          rounded-xl
          bg-cyan-500
          px-6
          py-3
          font-medium
          text-slate-950
          transition
          hover:bg-cyan-400
          disabled:opacity-50
        "
      >
        {loading
          ? "Generating..."
          : "Generate Report"}
      </button>


    </div>
  );
}