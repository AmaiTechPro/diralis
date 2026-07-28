import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is Diralis?",
    answer:
      "Diralis is an AI-powered Decision Intelligence Platform that transforms business data into actionable insights, forecasts, and recommendations."
  },
  {
    question: "Who is Diralis built for?",
    answer:
      "Diralis is designed for startups, SMEs, retailers, operations teams, and organizations that want to make smarter data-driven decisions."
  },
  {
    question: "Which file formats are supported?",
    answer:
      "The MVP will support CSV uploads, with Excel and additional data sources planned for future releases."
  },
  {
    question: "Is my business data secure?",
    answer:
      "Yes. Protecting customer data is one of our highest priorities. We are building the platform using industry-standard security practices."
  },
  {
    question: "When will Diralis launch?",
    answer:
      "The first public beta will launch after the MVP is completed. Early adopters can join the waiting list to receive updates."
  }
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section 
    id="faq"
    className="bg-slate-950 px-6 py-24">

      <div className="mx-auto max-w-4xl">

        <div className="text-center">

          <h2 className="text-5xl font-bold">
            Frequently Asked Questions
          </h2>

          <p className="mt-6 text-slate-400">
            Everything you need to know about Diralis.
          </p>

        </div>

        <div className="mt-16 space-y-5">

          {faqs.map((faq, index) => (

            <div
              key={index}
              className="rounded-2xl border border-slate-800 bg-slate-900"
            >

              <button
                onClick={() =>
                  setOpen(open === index ? null : index)
                }
                className="flex w-full items-center justify-between p-6 text-left"
              >

                <span className="text-lg font-semibold">
                  {faq.question}
                </span>

                <ChevronDown
                  className={`transition duration-300 ${
                    open === index ? "rotate-180" : ""
                  }`}
                />

              </button>

              {open === index && (

                <div className="px-6 pb-6 text-slate-400 leading-7">

                  {faq.answer}

                </div>

              )}

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}

