import { PrismaClient, BillingProvider } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding billing plans & provider config...");

  // 1. Ensure Primary Billing Provider is configured in DB
  await prisma.billingProviderConfig.upsert({
    where: { provider: BillingProvider.PAYSTACK },
    update: {
      enabled: true,
      priority: 1,
      supportedCurrencies: ["KES", "USD"],
      supportedIntervals: ["MONTHLY", "YEARLY"],
    },
    create: {
      provider: BillingProvider.PAYSTACK,
      enabled: true,
      priority: 1,
      supportedCurrencies: ["KES", "USD"],
      supportedIntervals: ["MONTHLY", "YEARLY"],
    },
  });

  // 2. Upsert standard subscription tiers
  const plans = [
    {
      code: "FREE",
      name: "Free Tier",
      version: 1,
      description: "Essential data intelligence tools to get you started.",
      monthlyPrice: 0,
      annualPrice: 0,
      currency: "USD",
      active: true,
      limits: {
        datasets: 3,
        storageMb: 50,
        reportsPerMonth: 5,
        forecastsPerMonth: 2,
        aiRequestsPerMonth: 20,
        teamMembers: 1,
      },
      features: {
        analytics: true,
        reports: true,
        aiChat: true,
        forecasting: false,
        aiAgent: false,
        advancedAnalytics: false,
        integrations: false,
        prioritySupport: false,
        dedicatedSupport: false,
      },
    },
    {
      code: "STARTER",
      name: "Starter",
      version: 1,
      description: "For small teams needing consistent reporting and forecasting.",
      monthlyPrice: 2900, // $29.00 in cents
      annualPrice: 29000, // $290.00 in cents
      currency: "USD",
      active: true,
      limits: {
        datasets: 15,
        storageMb: 500,
        reportsPerMonth: 50,
        forecastsPerMonth: 20,
        aiRequestsPerMonth: 200,
        teamMembers: 3,
      },
      features: {
        analytics: true,
        reports: true,
        aiChat: true,
        forecasting: true,
        aiAgent: false,
        advancedAnalytics: false,
        integrations: true,
        prioritySupport: false,
        dedicatedSupport: false,
      },
    },
    {
      code: "PRO",
      name: "Pro",
      version: 1,
      description: "Full intelligence suite with autonomous AI agents and deep analytics.",
      monthlyPrice: 7900, // $79.00 in cents
      annualPrice: 79000, // $790.00 in cents
      currency: "USD",
      active: true,
      limits: {
        datasets: 50,
        storageMb: 2000,
        reportsPerMonth: 200,
        forecastsPerMonth: 100,
        aiRequestsPerMonth: 1000,
        teamMembers: 10,
      },
      features: {
        analytics: true,
        reports: true,
        aiChat: true,
        forecasting: true,
        aiAgent: true,
        advancedAnalytics: true,
        integrations: true,
        prioritySupport: true,
        dedicatedSupport: false,
      },
    },
    {
      code: "BUSINESS",
      name: "Business",
      version: 1,
      description: "High-volume data processing and priority processing power.",
      monthlyPrice: 19900, // $199.00 in cents
      annualPrice: 199000, // $1990.00 in cents
      currency: "USD",
      active: true,
      limits: {
        datasets: 200,
        storageMb: 10000,
        reportsPerMonth: 1000,
        forecastsPerMonth: 500,
        aiRequestsPerMonth: 5000,
        teamMembers: 25,
      },
      features: {
        analytics: true,
        reports: true,
        aiChat: true,
        forecasting: true,
        aiAgent: true,
        advancedAnalytics: true,
        integrations: true,
        prioritySupport: true,
        dedicatedSupport: true,
      },
    },
    {
      code: "CUSTOM",
      name: "Enterprise",
      version: 1,
      description: "Custom infrastructure, dedicated SLAs, and bespoke limits.",
      monthlyPrice: null,
      annualPrice: null,
      currency: "USD",
      active: true,
      limits: {
        datasets: null,
        storageMb: null,
        reportsPerMonth: null,
        forecastsPerMonth: null,
        aiRequestsPerMonth: null,
        teamMembers: null,
      },
      features: {
        analytics: true,
        reports: true,
        aiChat: true,
        forecasting: true,
        aiAgent: true,
        advancedAnalytics: true,
        integrations: true,
        prioritySupport: true,
        dedicatedSupport: true,
        customLimits: true,
        customIntegrations: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
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
        active: plan.active,
      },
      create: {
        code: plan.code,
        name: plan.name,
        version: plan.version,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        currency: plan.currency,
        limits: plan.limits,
        features: plan.features,
        active: plan.active,
      },
    });
  }

  console.log("✅ Billing plans and provider configuration seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    (globalThis as any).process?.exit?.(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  