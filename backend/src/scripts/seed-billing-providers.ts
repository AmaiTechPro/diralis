import "dotenv/config";
import prisma from "../lib/prisma";

const providers = [
  {
    provider: "PAYSTACK" as const,
    enabled: true,
    priority: 1,
  },
  {
    provider: "PAYPAL" as const,
    enabled: false,
    priority: 2,
  },
  {
    provider: "FLUTTERWAVE" as const,
    enabled: false,
    priority: 3,
  },
  {
    provider: "STRIPE" as const,
    enabled: false,
    priority: 4,
  },
  {
    provider: "OTHER" as const,
    enabled: false,
    priority: 99,
  },
];

async function main() {
  console.log(
    "🌱 Seeding Diralis billing providers...\n"
  );

  for (const provider of providers) {
    const result =
      await prisma.billingProviderConfig.upsert({
        where: {
          provider: provider.provider,
        },

        update: {
          enabled: provider.enabled,
          priority: provider.priority,
        },

        create: provider,
      });

    console.log(
      `✅ ${result.provider} — ${
        result.enabled ? "ENABLED" : "DISABLED"
      }`
    );
  }

  console.log(
    "\n🎉 Billing providers seeded successfully."
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Failed to seed billing providers:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  