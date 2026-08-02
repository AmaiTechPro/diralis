import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { X } from "lucide-react";

const whatsappLink = `https://wa.me/254745422895?text=${encodeURIComponent(
`Hello Diralis Team,

I recently visited the Diralis website and would like to get in touch.

Reason for contacting you:
• Product Demo
• Technical Support
• Partnership
• Pricing
• General Inquiry

Name:
Organization:
Message:
`
)}`;

export default function FloatingWhatsApp() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("diralis-whatsapp-popup");

    if (dismissed) return;

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  function closePopup() {
    localStorage.setItem("diralis-whatsapp-popup", "true");
    setShowPopup(false);
  }

  return (
    <>
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-28 right-6 z-[9998] w-80 rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <button
              onClick={closePopup}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500 p-3">
                <FaWhatsapp
                  className="text-white"
                  size={22}
                />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Need help?
                </h3>

                <p className="text-sm text-slate-400">
                  Chat with the Diralis Team
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              💬 Usually replies within <b>10 minutes</b>.
            </p>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-green-500 px-5 py-3 font-semibold text-white transition hover:bg-green-600"
            >
              <FaWhatsapp size={22} />
              Talk to Diralis
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-full bg-green-500 px-5 py-4 text-white shadow-2xl hover:bg-green-600"
      >
        <FaWhatsapp size={28} />

        <span className="hidden font-semibold sm:block">
          Talk to Diralis
        </span>
      </motion.a>
    </>
  );
}

