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
      className="fixed bottom-6 right-6 z-[9999] group"
    >
      <div className="flex items-center gap-3 rounded-full bg-[#25D366] px-5 py-3 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-green-500/40 animate-pulse">

        <div className="rounded-full bg-white p-2">
          <MessageCircle
            size={24}
            className="text-[#25D366]"
          />
        </div>

        <div className="hidden sm:block">
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


