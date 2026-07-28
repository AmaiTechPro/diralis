import { motion } from "framer-motion";


const testimonials = [
  {
    quote:
      "Diralis helped our team identify operational issues before they became expensive problems. The AI recommendations changed how we make decisions.",

    name:
      "Amina Wanjiku",

    role:
      "Operations Lead",

    company:
      "Nova Retail",
  },


  {
    quote:
      "Instead of spending hours analyzing spreadsheets, we now get actionable insights in minutes. The forecasting capability is impressive.",

    name:
      "Daniel Otieno",

    role:
      "Business Analyst",

    company:
      "Vertex Labs",
  },


  {
    quote:
      "The dashboard gives our team a clear picture of performance and helps us focus on what matters most.",

    name:
      "Sarah Kimani",

    role:
      "Founder",

    company:
      "CloudMart",
  },
];


export default function Testimonials() {

  return (

    <section className="px-6 py-20">


      <div className="mx-auto max-w-7xl">


        <motion.div

          initial={{
            opacity: 0,
            y: 20,
          }}

          whileInView={{
            opacity: 1,
            y: 0,
          }}

          viewport={{
            once: true,
          }}

          transition={{
            duration: 0.6,
          }}

          className="text-center"

        >

          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Customer Stories
          </p>


          <h2 className="mt-4 text-3xl font-bold text-white">
            Loved by teams building smarter businesses
          </h2>


          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            See how businesses use AI-powered intelligence
            to improve their daily operations.
          </p>


        </motion.div>



        <div className="mt-12 grid gap-6 lg:grid-cols-3">


          {testimonials.map((testimonial,index)=>(


            <motion.div

              key={testimonial.name}

              initial={{
                opacity:0,
                y:30,
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
                y:-6,
              }}


              className="
              rounded-2xl
              border
              border-slate-800
              bg-slate-900/70
              p-6
              backdrop-blur
              hover:border-cyan-500/40
              "

            >

              {/* Quote */}

              <p className="text-slate-300 leading-7">
                "{testimonial.quote}"
              </p>



              {/* User */}

              <div className="mt-6 flex items-center gap-4">


                <div
                  className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-cyan-500/20
                  font-bold
                  text-cyan-400
                  "
                >
                  {testimonial.name.charAt(0)}
                </div>


                <div>

                  <p className="font-semibold text-white">
                    {testimonial.name}
                  </p>


                  <p className="text-sm text-slate-400">
                    {testimonial.role} · {testimonial.company}
                  </p>

                </div>


              </div>


            </motion.div>


          ))}


        </div>


      </div>


    </section>

  );
}


