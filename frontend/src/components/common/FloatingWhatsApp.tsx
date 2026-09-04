import { MessageCircle } from "lucide-react";

const phone = "254745422895";

const message = encodeURIComponent(`👋 Hello Diralis Team!

I'm interested in Diralis AI Decision Intelligence Platform.

My name:
Company (optional):
Country:

I'd like help with:
• Product Demo
• Pricing
• AI Integration
• Technical Support
• Partnership
• Other:

Additional details:
`);

export default function FloatingWhatsApp() {
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 z-30 group"
    >
      <div className="flex items-center gap-0 group-hover:gap-3 rounded-full bg-[#25D366] p-3 group-hover:px-5 group-hover:py-3 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/40">
        <div className="rounded-full bg-white p-2 shrink-0">
          <MessageCircle
            size={22}
            className="text-[#25D366]"
          />
        </div>

        <div className="max-w-0 overflow-hidden opacity-0 whitespace-nowrap transition-all duration-300 ease-in-out group-hover:max-w-xs group-hover:opacity-100">
          <p className="text-sm font-semibold text-white">
            Need Help?
          </p>
          <p className="text-xs text-white/90">
            Chat on WhatsApp
          </p>
        </div>
      </div>
    </a>
  );
}

