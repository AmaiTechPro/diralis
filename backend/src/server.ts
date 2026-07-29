import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("==================================");
  console.log("🚀 Diralis Backend Started");
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log("==================================");
});


