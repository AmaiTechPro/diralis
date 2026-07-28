import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useState } from "react";


const plans = [
  {
    name: "Starter",

    description:
      "Perfect for individuals and small teams exploring AI insights.",

    monthly:
      19,

    yearly:
      15,

    features: [
      "CSV Data Uploads",
      "Basic Analytics",
      "AI Recommendations",
      "Email Support",
    ],

    popular:false,
  },


  {
    name:"Professional",

    description:
      "Advanced intelligence tools for growing businesses.",

    monthly:
      49,

    yearly:
      39,

    features:[
      "Everything in Starter",
      "Advanced Forecasting",
      "Live Dashboard",
      "Priority Support",
    ],

    popular:true,
  },


  {
    name:"Enterprise",

    description:
      "Custom solutions for large organizations.",

    monthly:null,

    yearly:null,

    features:[
      "Custom AI Models",
      "API Access",
      "Dedicated Support",
      "Advanced Security",
    ],

    popular:false,
  },
];



export default function Pricing(){

  const [billing, setBilling] = useState<
    "monthly" | "yearly"
  >("monthly");


  return (

<section className="px-6 py-24">


<div className="mx-auto max-w-7xl">


<motion.div

initial={{
opacity:0,
y:20
}}

whileInView={{
opacity:1,
y:0
}}

viewport={{
once:true
}}

className="text-center"

>

<p className="text-sm uppercase tracking-widest text-cyan-400">
Pricing
</p>


<h2 className="mt-4 text-4xl font-bold text-white">
Simple pricing that scales with you
</h2>


<p className="mx-auto mt-4 max-w-2xl text-slate-400">
Choose a plan that fits your business intelligence needs.
</p>
<div className="mt-8 flex justify-center">

  <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 p-1">


    <button
      onClick={() => setBilling("monthly")}
      className={`
        rounded-full px-5 py-2 text-sm transition
        ${
          billing === "monthly"
          ?
          "bg-cyan-500 text-slate-950"
          :
          "text-slate-400"
        }
      `}
    >
      Monthly
    </button>


    <button
      onClick={() => setBilling("yearly")}
      className={`
        rounded-full px-5 py-2 text-sm transition
        ${
          billing === "yearly"
          ?
          "bg-cyan-500 text-slate-950"
          :
          "text-slate-400"
        }
      `}
    >
      Yearly
      <span className="ml-2 text-xs text-cyan-400">
       Save 20%
          </span>
    </button>


  </div>

</div>


</motion.div>



<div className="mt-14 grid gap-8 lg:grid-cols-3">


{plans.map((plan,index)=>(



<motion.div

key={plan.name}

initial={{
opacity:0,
y:40,
}}

whileInView={{
opacity:1,
y:0,
}}

viewport={{
once:true,
}}

transition={{
duration:0.5,
delay:index * 0.15,
}}

whileHover={{
y:-10,
scale:1.02,
}}

className={`
relative
rounded-3xl
border
p-8
backdrop-blur

${
plan.popular
?
"border-cyan-400 bg-cyan-500/10 shadow-xl shadow-cyan-500/20"
:
"border-slate-800 bg-slate-900/70"
}

`}

>
    {
plan.popular && (

<div className="
absolute
inset-0
- z-10
rounded-3xl
bg-cyan-400/10
blur-2xl
pointer-events-none
"/>

)
}


{
plan.popular && (

<div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-4 py-1 text-sm font-semibold text-slate-950">

Most Popular

</div>

)
}



<h3 className="text-2xl font-bold text-white">
{plan.name}
</h3>


<p className="mt-3 text-sm text-slate-400">
{plan.description}
</p>



<div className="mt-6">

{
plan.monthly ?

(

<div className="mt-6">

<AnimatePresence mode="wait">

<motion.h4

key={`${plan.name}-${billing}`}

initial={{
opacity:0,
y:10,
}}

animate={{
opacity:1,
y:0,
}}

exit={{
opacity:0,
y:-10,
}}

transition={{
duration:0.25,
}}

className="text-4xl font-bold text-white"

>

{
plan.monthly
?

<>
$
{
billing === "monthly"
?
plan.monthly
:
plan.yearly
}

<span className="text-sm font-normal text-slate-400">
/month
</span>

</>

:

"Custom"

}

</motion.h4>

</AnimatePresence>

</div>


)

:

(

<h4 className="text-3xl font-bold text-white">
Custom
</h4>

)

}

</div>




<ul className="mt-8 space-y-3">

{plan.features.map((feature,featureIndex)=>(

<motion.li

key={feature}

initial={{
opacity:0,
x:-10,
}}

whileInView={{
opacity:1,
x:0,
}}

viewport={{
once:true,
}}

transition={{
duration:0.3,
delay:featureIndex * 0.08,
}}

className="flex items-center gap-2 text-sm text-slate-300"

>

<span className="text-cyan-400">
✓
</span>

{feature}

</motion.li>

))
}

</ul>




<motion.button

whileHover={{
scale:1.05,
}}

whileTap={{
scale:0.97,
}}

className="
mt-8
w-full
rounded-xl
bg-cyan-500
py-3
font-semibold
text-slate-950
transition
hover:bg-cyan-400
"

>

{
plan.name==="Enterprise"
?
"Contact Sales"
:
"Start Free Trial"
}

</motion.button>



</motion.div>


))}


</div>


</div>


</section>

  );

}

