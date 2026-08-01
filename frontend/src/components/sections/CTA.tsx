import { useNavigate } from "react-router-dom";

import Button from "../ui/Button";


export default function CTA() {

  const navigate = useNavigate();


  return (

    <section
      id="cta"
      className="bg-cyan-500 py-24 px-6"
    >

      <div className="mx-auto max-w-4xl text-center">


        <h2 className="text-4xl font-extrabold text-slate-950 md:text-6xl">

          Ready to Make Better Business Decisions?

        </h2>



        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-800">

          Start using Diralis and transform your business data
          into actionable AI-powered insights.

        </p>





        <div className="mt-12 flex flex-wrap justify-center gap-5">



          <Button

            onClick={() => navigate("/register")}

            className="bg-slate-950 text-white hover:bg-slate-800"

          >

            Get Started

          </Button>





          <Button

            variant="secondary"

            className="border-slate-950 text-slate-950 hover:bg-slate-900 hover:text-white"

          >

            Schedule Demo

          </Button>



        </div>


      </div>


    </section>

  );

}

