import { useEffect, useState } from "react";

interface LiveMetrics {
  revenue: number;
  customers: number;
  efficiency: number;
  confidence: number;
  revenueHistory: number[];
}

interface LiveMetricsProps {
  revenue: number;
  customers: number;
  efficiency: number;
  confidence: number;
}

export default function useLiveMetrics({
  revenue,
  customers,
  efficiency,
  confidence,
}: LiveMetricsProps) {
  const [metrics, setMetrics] = useState<LiveMetrics>({
    revenue,
    customers,
    efficiency,
    confidence,

    revenueHistory: [
      revenue - 10,
      revenue - 6,
      revenue - 4,
      revenue - 2,
      revenue - 1,
      revenue,
    ],
  });

  // Reset whenever backend values change
  useEffect(() => {
    setMetrics({
      revenue,
      customers,
      efficiency,
      confidence,
      revenueHistory: [
        revenue - 10,
        revenue - 6,
        revenue - 4,
        revenue - 2,
        revenue - 1,
        revenue,
      ],
    });
  }, [revenue, customers, efficiency, confidence]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((current) => {
        const newRevenue = Number(
          (
            current.revenue +
            (Math.random() * 0.4 - 0.2)
          ).toFixed(1)
        );

        const newHistory = [
          ...current.revenueHistory.slice(1),
          Number(
            (
              current.revenueHistory[current.revenueHistory.length - 1] +
              (Math.random() * 3 - 1)
            ).toFixed(1)
          ),
        ];

        return {
          revenue: newRevenue,

          customers:
            current.customers +
            Math.floor(Math.random() * 5),

          efficiency: Number(
            (
              current.efficiency +
              (Math.random() * 0.2 - 0.1)
            ).toFixed(1)
          ),

          confidence: Number(
            (
              current.confidence +
              (Math.random() * 0.2 - 0.1)
            ).toFixed(1)
          ),

          revenueHistory: newHistory,
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}


