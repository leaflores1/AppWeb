import mongoose from "mongoose";

const SellerSchema = new mongoose.Schema({
  sellerId: { type: String, required: true, unique: true }, // ID interno del vendedor en tu sistema
  access_token: { type: String, required: true }, // Token de acceso a MP
  refresh_token: { type: String, required: true }, // Token para renovar acceso
  user_id: { type: Number, required: true }, // ID del vendedor en Mercado Pago
  expires_in: { type: Number, required: true }, // Tiempo de expiración del token en segundos
  obtained_at: { type: Date, default: Date.now }, // Fecha en que se obtuvo el token
  site_id: { type: String, required: true }, // 🔹 ID del país en MP (MLA, MLB, MLC, etc.)
});

const Seller = mongoose.model("Seller", SellerSchema);

export default Seller;
