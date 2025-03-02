import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { getChats, getChatById, sendMessage, createChat } from "./chat.controller.js";

const router = Router();

// Obtener todas las conversaciones del usuario
router.get("/", auth, getChats);

// Crear (iniciar) un nuevo chat
router.post("/start", auth, createChat);

// Obtener una conversación por ID
router.get("/:chatId", auth, getChatById);

// Enviar un mensaje en una conversación
router.post("/:chatId/messages", auth, sendMessage);

export default router;
