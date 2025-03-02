import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import dotenv from "dotenv";
import fs from "fs";
import { Server } from "socket.io";
import http from "http";
import helmet from "helmet";

// Importa tus rutas
import authRoutes from "./routes/auth.routes.js";
import photosRoutes from "./routes/photos.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import feedRoutes from "./routes/feed.routes.js";
import followRoutes from "./routes/follow.routes.js";
import albumsRoutes from "./routes/albums.routes.js";
import likesRoutes from "./routes/likes.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import mpRoutes from "./routes/mp.routes.js";
import notiRoutes from "./routes/noti.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import reportRoutes from "./routes/report.routes.js";
import supportRoutes from "./routes/support.routes.js";
import chatRoutes from "./chat/chat.routes.js";
import usersRoutes from "./routes/users.routes.js";
import blockRoutes from "./routes/block.routes.js";

dotenv.config();

const app = express();

// Middleware de CORS (usa las URL correctas para desarrollo)
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost",
    ],
  })
);

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Configurar Helmet: CSP y política de referer
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      // Se amplía la lista de dominios para permitir scripts de MP internacionales,
      // además de incluir el dominio del SDK de MP.
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "blob:",
        "https://mercadopago.com.br",
        "https://*.mercadopago.com.br",
        "https://mercadopago.com",
        "https://*.mercadopago.com",
        "https://mercadopago.com.co",
        "https://*.mercadopago.com.co",
        "https://sdk.mercadopago.com", // Agregado para el SDK de MP
        "https://js-agent.newrelic.com",
        "https://*.js-agent.newrelic.com",
        "https://siteintercept.qualtrics.com",
        "https://*.siteintercept.qualtrics.com",
        "https://http2.mlstatic.com",
        "https://*.http2.mlstatic.com",
        "https://googletagmanager.com",
        "https://*.googletagmanager.com",
        "https://google.com",
        "https://*.google.com",
        "https://mercadopago.cl",
        "https://*.mercadopago.cl",
        "https://mercadopago.com.mx",
        "https://*.mercadopago.com.mx",
        "https://hotjar.com",
        "https://*.hotjar.com",
        "https://mercadopago.com.pe",
        "https://*.mercadopago.com.pe",
        "https://mercadopago.com.uy",
        "https://*.mercadopago.com.uy",
        "https://mercadopago.com.ar",
        "https://*.mercadopago.com.ar",
        "https://static.hotjar.com",
        "https://*.static.hotjar.com",
        "https://mercadopago.com.ve",
        "https://*.mercadopago.com.ve",
        "https://newrelic.com",
        "https://*.newrelic.com",
        "https://www.gstatic.com", // para recaptcha y otros scripts de Google
      ],
      connectSrc: ["'self'", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
    },
  })
);

// Agregar también la política de referer (esto se envía como header Referrer-Policy)
app.use(helmet.referrerPolicy({ policy: "no-referrer-when-downgrade" }));

// Configuración de fileUpload para fotos, perfil y álbumes
const tempDir = "./archivos";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
  //console.log(`Directorio temporal creado en ${tempDir}`);
} else {
  //console.log(`Directorio temporal ya existe en ${tempDir}`);
}

app.use(
  "/api/photos/upload",
  fileUpload({
    useTempFiles: true,
    tempFileDir: tempDir,
    debug: true,
  })
);
app.use(
  "/api/profile/upload",
  fileUpload({
    useTempFiles: true,
    tempFileDir: tempDir,
    debug: true,
  })
);
app.use(
  "/api/albums",
  fileUpload({
    useTempFiles: true,
    tempFileDir: tempDir,
    debug: true,
  })
);

// Agrega este middleware antes de tus rutas:
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas principales
app.use("/api/auth", authRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/noti", notiRoutes);
app.use("/api/comment", commentRoutes);
app.use("/api/albums", albumsRoutes);
app.use("/api/photos", likesRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/mp", mpRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/block", blockRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error("Error capturado por el middleware global:", err.stack);
  res.status(500).json({ error: "Algo salió mal en el servidor" });
});

app.get("/api", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// Crear y exportar el servidor HTTP
export const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("sendMessage", ({ chatId, message, sender }) => {
    io.to(chatId).emit("receiveMessage", { chatId, message, sender });
  });

  socket.on("disconnect", () => {
    // Manejo de desconexión
  });
});

export default app;
