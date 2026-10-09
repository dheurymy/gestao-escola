// Uso: npm run create-user -- <usuario> <senha> "<Nome do professor>"
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../api/_lib/models.js";

async function main() {
  const [username, password, ...nameParts] = process.argv.slice(2);
  const name = nameParts.join(" ") || username;
  if (!username || !password) {
    console.error('Uso: npm run create-user -- <usuario> <senha> "<Nome>"');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) throw new Error("Defina MONGODB_URI no arquivo .env");
  await mongoose.connect(process.env.MONGODB_URI);
  const passwordHash = await bcrypt.hash(password, 10);
  await User.findOneAndUpdate(
    { username: username.toLowerCase() },
    { username: username.toLowerCase(), name, passwordHash },
    { upsert: true },
  );
  console.log(`Usuário "${username}" criado/atualizado.`);
  await mongoose.disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
