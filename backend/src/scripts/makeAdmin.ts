import prisma from "../lib/prisma";

async function main() {
  const email = "brian.amai.instr@gmail.com";

  const user = await prisma.user.update({
    where: {
      email,
    },
    data: {
      role: "ADMIN",
      username: "AmaiDiralis",
    },
  });

  console.log("✅ Admin account updated successfully");
  console.log({
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("❌ Failed to update admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  