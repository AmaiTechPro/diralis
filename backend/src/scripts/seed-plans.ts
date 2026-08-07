import "dotenv/config";
import prisma from "../lib/prisma";


// Prices are stored in the smallest currency unit.
// USD example: $19.99 = 1999.
// null = pricing not finalized / custom pricing.

const plans = [
  {
    code: "FREE",
    version: 1,
    name: "Free",
    description: "Get started with Diralis and explore core decision intelligence features.",
    monthlyPrice: 0,
    annualPrice: 0,
    currency: "USD",

    limits: {
      datasets: 3,
      storageMb: 100,
      reportsPerMonth: 5,
      aiRequestsPerMonth: 25,
      forecastsPerMonth: 5,
      teamMembers: 1,
    },

    features: {
      analytics: true,
      forecasting: true,
      reports: true,
      aiChat: true,
      aiAgent: false,
      advancedAnalytics: false,
      integrations: false,
      prioritySupport: false,
    },
  },

  {
    code: "STARTER",
    version: 1,
    name: "Starter",
    description: "For individuals and small businesses getting serious about data-driven decisions.",
    monthlyPrice: 1500,
    annualPrice: 14400,
    currency: "USD",

    limits: {
      datasets: 10,
      storageMb: 1000,
      reportsPerMonth: 25,
      aiRequestsPerMonth: 250,
      forecastsPerMonth: 25,
      teamMembers: 3,
    },

    features: {
      analytics: true,
      forecasting: true,
      reports: true,
      aiChat: true,
      aiAgent: true,
      advancedAnalytics: false,
      integrations: false,
      prioritySupport: false,
    },
  },

  {
    code: "PRO",
    version: 1,
    name: "Pro",
    description: "Advanced decision intelligence and AI capabilities for growing businesses.",
    monthlyPrice: 3900,
    annualPrice: 39000,
    currency: "USD",

    limits: {
      datasets: 50,
      storageMb: 10000,
      reportsPerMonth: 100,
      aiRequestsPerMonth: 1500,
      forecastsPerMonth: 100,
      teamMembers: 10,
    },

    features: {
      analytics: true,
      forecasting: true,
      reports: true,
      aiChat: true,
      aiAgent: true,
      advancedAnalytics: true,
      integrations: true,
      prioritySupport: true,
    },
  },

  {
    code: "BUSINESS",
    version: 1,
    name: "Business",
    description: "High-capacity AI decision intelligence for established businesses and teams.",
    monthlyPrice: 9900,
    annualPrice: 99000,
    currency: "USD",

    limits: {
      datasets: 250,
      storageMb: 50000,
      reportsPerMonth: 500,
      aiRequestsPerMonth: 10000,
      forecastsPerMonth: 500,
      teamMembers: 50,
    },

    features: {
      analytics: true,
      forecasting: true,
      reports: true,
      aiChat: true,
      aiAgent: true,
      advancedAnalytics: true,
      integrations: true,
      prioritySupport: true,
    },
  },

  {
    code: "CUSTOM",
    version: 1,
    name: "Custom",
    description: "Tailored capabilities, limits, integrations, and support for larger organizations.",
    monthlyPrice: null,
    annualPrice: null,
    currency: "USD",

    limits: {
      datasets: null,
      storageMb: null,
      reportsPerMonth: null,
      aiRequestsPerMonth: null,
      forecastsPerMonth: null,
      teamMembers: null,
    },

    features: {
      analytics: true,
      forecasting: true,
      reports: true,
      aiChat: true,
      aiAgent: true,
      advancedAnalytics: true,
      integrations: true,
      prioritySupport: true,
      customLimits: true,
      customIntegrations: true,
      dedicatedSupport: true,
    },
  },
];

async function main() {
  console.log("🌱 Seeding Diralis subscription plans...\n");

  for (const plan of plans) {
    const result = await prisma.subscriptionPlan.upsert({
      where: {
      code_version: {
      code: plan.code,
      version: plan.version,
        },
      },

      update: {
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        limits: plan.limits,
        features: plan.features,
        active: true,
      },

      create: plan,
    });

    console.log(`✅ ${result.code} — ${result.name}`);
  }

  console.log("\n🎉 Subscription plans seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Failed to seed subscription plans:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

