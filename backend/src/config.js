import dotenv from "dotenv";

// Determina el archivo .env según el entorno (seguro para Docker y desarrollo)
const envFile = process.env.NODE_ENV?.trim() === "production" ? ".env" : ".env.dev";
//console.log(`🟢 Cargando variables desde: ${envFile}`);

dotenv.config({ path: envFile });

// Exportar variables
export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI;
export const TOKEN_SECRET = process.env.TOKEN_SECRET;
export const FRONTEND_URL = process.env.FRONTEND_URL;
export const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
export const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
export const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;
export const AWS_PUBLIC_BUCKET = process.env.AWS_PUBLIC_BUCKET;
export const AWS_PRIVATE_BUCKET = process.env.AWS_PRIVATE_BUCKET;
export const MERCADOPAGO_API_KEY = process.env.MERCADOPAGO_API_KEY;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
