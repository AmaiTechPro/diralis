import { Mail, Phone, MessageCircle } from "lucide-react";

export default function Contact() {
  return (
    <section
      id="contact"
      className="bg-slate-950 py-24 px-6 border-t border-slate-800"
    >
      <div className="mx-auto max-w-7xl grid gap-12 lg:grid-cols-2">

        {/* Left */}

        <div>
          <h2 className="text-4xl font-bold text-white">
            Contact Us
          </h2>

          <p className="mt-6 text-slate-400 leading-8">
            We'd love to hear from you. Reach out for support,
            partnerships, demos or general inquiries.
          </p>

          <div className="mt-10 space-y-6">

            <div className="flex items-center gap-4">
              <Mail className="text-cyan-400" />
              <span>team.diralis@gmail.com</span>
            </div>

            <div className="flex items-center gap-4">
              <Phone className="text-cyan-400" />
              <span>+254 745 422 895</span>
            </div>

            <a
              href="https://wa.me/254745422895"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-xl bg-green-600 px-6 py-3 font-semibold hover:bg-green-500"
            >
              <MessageCircle size={20} />
              Chat on WhatsApp
            </a>

          </div>
        </div>

        {/* Right */}

        <form
          action="mailto:team.diralis@gmail.com"
          method="POST"
          encType="text/plain"
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >

          <input
            type="text"
            name="Name"
            placeholder="Full Name"
            required
            className="w-full rounded-lg bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <input
            type="email"
            name="Email"
            placeholder="Email Address"
            required
            className="w-full rounded-lg bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <input
            type="text"
            name="Company"
            placeholder="Company (Optional)"
            className="w-full rounded-lg bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <textarea
            name="Message"
            rows={6}
            placeholder="Your message..."
            required
            className="w-full rounded-lg bg-slate-800 p-4 outline-none focus:ring-2 focus:ring-cyan-500"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-500 py-4 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Send Message
          </button>

        </form>

      </div>
    </section>
  );
}

