interface Props {
  summary: string;
  quality: string[];
  statistics: string[];
  anomalies: string[]; // Added anomalies array property
  business: string[];
  forecast: string[];
  kpis: string[];
  rootCauses: string[];
}

export default function AIInsightsCard({
  summary,
  quality = [],
  statistics = [],
  anomalies = [],
  business = [],
  forecast = [],
  kpis = [],
  rootCauses = [],
}: Props) {
  return (
    <div className="rounded-2xl border border-cyan-900 bg-cyan-950/20 p-6">

      <h2 className="mb-4 text-xl font-semibold text-cyan-300">
        🤖 AI Insights
      </h2>

      <div className="space-y-5">

        {/* Executive Summary */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            Executive Summary
          </h3>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 text-slate-300 leading-7">
            {summary}
          </div>
        </div>

        {/* 🚨 Anomaly Detection Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-rose-400">
            🚨 Anomaly Detection
          </h3>

          <div className="space-y-3">
            {anomalies.length > 0 ? (
              anomalies.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-rose-950 bg-slate-900 p-3 text-slate-300"
                >
                  ⚠️ {item}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-emerald-950 bg-slate-900 p-3 text-emerald-400 text-sm">
                ✓ No unusual anomalies, spikes, or sudden data variations detected.
              </div>
            )}
          </div>
        </div>

        {/* Quality Analysis Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            Quality Analysis
          </h3>

          <div className="space-y-3">
            {quality.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300"
              >
                • {item}
              </div>
            ))}
          </div>
        </div>
        
        {/* Statistics Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            Statistical Insights
          </h3>

          <div className="space-y-3">
            {statistics.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300"
              >
                • {item}
              </div>
            ))}
          </div>
        </div>
        
         {/*Anomaly Section */}
         
        {anomalies && anomalies.length > 0 && (
        <div className="insight-section">
        <h3 className="insight-title">🚨 Anomalies</h3>
       <ul className="insight-list">
         {anomalies.map((anomaly: string, index: number) => (
        <li key={index} className="insight-item">
          {anomaly}
        </li>
           ))}
       </ul>
     </div>
         )}



        {/* Business Insights Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            Business Insights
          </h3>

          <div className="space-y-3">
            {business.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300"
              >
                💡 {item}
              </div>
            ))}
          </div>
        </div>

        {/* Forecast Section */}
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-cyan-400">
            📈 Predictive Forecast
          </h3>

          <div className="space-y-3">
            {forecast.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-slate-300"
              >
                📈 {item}
              </div>
            ))}
          </div>
        </div>

        {/* KPI Section */}

        <div>
  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-yellow-400">
    ⭐ KPI Discovery
  </h3>

  <div className="space-y-3">
    {kpis.map((item, index) => (
      <div key={index} className="rounded-lg border border-yellow-900 bg-slate-900 p-3 text-slate-300">
        ⭐ {item}
      </div>
    ))}
  </div>
</div>

{/* Root Cause Section */}

<div>
  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-400">
    🧠 Root Cause Analysis
  </h3>

  <div className="space-y-3">
    {rootCauses.map((item, index) => (
      <div key={index} className="rounded-lg border border-orange-900 bg-slate-900 p-3 text-slate-300">
        🧠 {item}
      </div>
    ))}
  </div>
</div>

      </div>

    </div>
  );
}
