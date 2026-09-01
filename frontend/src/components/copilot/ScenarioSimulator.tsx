import React, { useState } from "react";
import { Sliders, RefreshCw, ArrowRight } from "lucide-react";

interface ScenarioSimulatorProps {
  baseMetricName: string;
  baselineValue: number;
  variableName: string;
  unit?: string;
  onApplySimulation?: (deltaPct: number) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  baseMetricName,
  baselineValue,
  variableName,
  unit = "$",
  onApplySimulation,
}) => {
  const [sliderVal, setSliderVal] = useState<number>(0);

  const deltaDecimal = sliderVal / 100;
  const simulatedValue = baselineValue * (1 + deltaDecimal);
  const diff = simulatedValue - baselineValue;

  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/90 p-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sliders size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">What-If Scenario Simulation</span>
        </div>
        <button
          onClick={() => setSliderVal(0)}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
        >
          <RefreshCw size={11} /> Reset
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Baseline {baseMetricName}</div>
          <div className="mt-1 text-base font-bold text-white">
            {unit}{baselineValue.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-cyan-950/30 p-3 border border-cyan-500/30">
          <div className="text-[10px] text-cyan-400 uppercase font-semibold">Simulated {baseMetricName}</div>
          <div className="mt-1 text-base font-bold text-cyan-300">
            {unit}{simulatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
          <span>
            Simulate Adjustment on: <strong>{variableName}</strong>
          </span>
          <span
            className={`font-mono font-bold ${
              sliderVal >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {sliderVal > 0 ? `+${sliderVal}%` : `${sliderVal}%`}
          </span>
        </div>
        <input
          type="range"
          min="-30"
          max="30"
          step="1"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>-30%</span>
          <span>Baseline (0%)</span>
          <span>+30%</span>
        </div>
      </div>

      {sliderVal !== 0 && (
        <div className="mt-4 text-xs text-slate-300 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span>
            Projected Impact:{" "}
            <strong className={diff >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {diff >= 0 ? `+${unit}${diff.toFixed(2)}` : `-${unit}${Math.abs(diff).toFixed(2)}`}
            </strong>
          </span>
          {onApplySimulation && (
            <button
              onClick={() => onApplySimulation(sliderVal)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Analyze with Copilot <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

