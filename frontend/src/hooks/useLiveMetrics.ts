import { useEffect, useState } from "react";

interface LiveMetrics {
  revenue: number;
  customers: number;
  confidence: number;
}

export default function useLiveMetrics() {

  const [metrics, setMetrics] = useState<LiveMetrics>({
    revenue: 18,
    customers: 24381,
    confidence: 97,
  });


  useEffect(() => {

    const interval = setInterval(() => {

      setMetrics((current) => ({
        revenue:
          Number(
            (
              current.revenue +
              (Math.random() * 0.4 - 0.2)
            ).toFixed(1)
          ),

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
      }));

    }, 4000);


    return () => clearInterval(interval);

  }, []);


  return metrics;
}


