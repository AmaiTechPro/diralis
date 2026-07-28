import { useEffect, useState } from "react";

interface LiveMetrics {
  revenue: number;
  customers: number;
  confidence: number;
  revenueHistory: number[];
}

export default function useLiveMetrics() {

  const [metrics, setMetrics] = useState<LiveMetrics>({
    revenue: 18,
    customers: 24381,
    confidence: 97,

    revenueHistory: [
      18,
      24,
      22,
      31,
      36,
      42,
    ],
  });


  useEffect(() => {

    const interval = setInterval(() => {

      setMetrics((current) => {

        const newRevenue =
          Number(
            (
              current.revenue +
              (Math.random() * 0.4 - 0.2)
            ).toFixed(1)
          );


        const newHistory = [
          ...current.revenueHistory.slice(1),

          Number(
            (
              current.revenueHistory[
                current.revenueHistory.length - 1
              ] +
              (Math.random() * 3 - 1)
            ).toFixed(1)
          ),
        ];


        return {

          revenue: newRevenue,

          customers:
            current.customers +
            Math.floor(Math.random() * 5),


          confidence:
            Number(
              (
                current.confidence +
                (Math.random() * 0.2 - 0.1)
              ).toFixed(1)
            ),


          revenueHistory: newHistory,

        };

      });


    },4000);


    return () => clearInterval(interval);


  },[]);


  return metrics;
}



