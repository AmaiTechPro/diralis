import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  Tooltip,
} from "recharts";


interface RevenueChartProps {
  revenueHistory: number[];
}


export default function RevenueChart({
  revenueHistory,
}: RevenueChartProps) {

  const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
];


const data = months.map(
  (month,index)=>({

    month,

    revenue:
      revenueHistory[index],

  })
);


  return (
    <div className="rounded-xl bg-slate-800 p-5">

      <h4 className="mb-4 font-semibold text-slate-200">
        Revenue Trend
      </h4>


      <div className="h-48">

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart data={data}>

            <XAxis
              dataKey="month"
              tick={{
                fill: "#94a3b8",
                fontSize: 12,
              }}
              axisLine={false}
              tickLine={false}
            />


            <Tooltip />


            <Line
              type="monotone"
              dataKey="revenue"
              animationDuration={1200}
              stroke="#22d3ee"
              strokeWidth={3}
              dot={{
                r: 4,
              }}
              activeDot={{
                r: 6,
              }}
            />


          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

