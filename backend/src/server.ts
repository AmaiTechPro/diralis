import dotenv from "dotenv";

dotenv.config();

import app from "./app";

import overallInsightsRoutes from "./routes/overallInsightsRoutes";

app.use(
  "/api/overall-insights",
  overallInsightsRoutes
);

import userProfileRoutes from "./routes/userProfileRoutes";

app.use(
  "/api/profile",
  userProfileRoutes
);

import settingsRoutes from "./routes/settingsRoutes";

app.use(
 "/api/settings",
 settingsRoutes
);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Diralis Backend Started");
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log("==================================");
});
