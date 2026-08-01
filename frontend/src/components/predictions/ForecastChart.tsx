import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";


interface ForecastChartProps {

  historical:number[];

  forecast:number[];

}



export default function ForecastChart({

  historical,

  forecast

}:ForecastChartProps){


  const data = [

    ...historical.map(
      (value,index)=>({

        period:
          `Past ${index + 1}`,

        actual:
          value,

        forecast:
          null

      })
    ),


    ...forecast.map(
      (value,index)=>({

        period:
          `Future ${index + 1}`,

        actual:
          null,

        forecast:
          value

      })
    )

  ];



  return (

    <div className="rounded-xl border p-6">

      <h2 className="text-xl font-bold mb-4">

        🔮 AI Forecast

      </h2>


      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <LineChart data={data}>


          <XAxis
            dataKey="period"
          />


          <YAxis />


          <Tooltip />


          <Legend />


          <Line

            type="monotone"

            dataKey="actual"

            name="Historical"

          />


          <Line

            type="monotone"

            dataKey="forecast"

            name="Prediction"

          />


        </LineChart>


      </ResponsiveContainer>


    </div>

  );

}

