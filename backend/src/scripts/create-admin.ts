import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("ADMIN_PASSWORD environment variable is required");
  }

  const hashedPassword = await bcrypt.hash(
    adminPassword,
    10
  );

  const admin = await prisma.user.create({
    data: {
      fullName: process.env.ADMIN_NAME || "Brian David Amai",

      username:
        process.env.ADMIN_USERNAME || "admin",

      email:
        process.env.ADMIN_EMAIL || "admin@example.com",

      password: hashedPassword,

      provider: "local",

      role: "ADMIN",

      status: "ACTIVE",

      emailVerified: true,
    },
  });

  console.log("✅ Admin created successfully");

  console.log({
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    emailVerified: admin.emailVerified,
  });
}

main()
  .catch((error) => {
    console.error("❌ Failed to create admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });