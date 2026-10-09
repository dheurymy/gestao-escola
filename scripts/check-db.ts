// Uso: npm run check-db  — testa a conexão com o MongoDB sem mostrar a senha.
import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI ?? "";
if (!uri || uri.includes("COLE_AQUI")) {
  console.log("MONGODB_URI não preenchida no .env");
  process.exit(1);
}

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async (m) => {
    console.log(`Conectado ao banco "${m.connection.name}".`);
    await m.disconnect();
  })
  .catch((e) => {
    console.log("Falha na conexão:", String(e.message).replace(/\/\/[^@]*@/g, "//***@"));
    process.exit(1);
  });
