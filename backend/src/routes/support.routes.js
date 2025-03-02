import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { SupportMessage } from "../models/support.model.js"; // Asegúrate de crear este modelo si aún no existe

const router = Router();

// Ruta para recibir mensajes de soporte
router.post("/help", auth, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ error: "Asunto y mensaje son obligatorios" });
    }

    const newMessage = new SupportMessage({
      userId: req.user.id,
      subject,
      message,
      status: "pending", // Puedes usar estados como 'pending', 'reviewed', etc.
    });

    await newMessage.save();
    return res.status(200).json({ message: "Mensaje enviado con éxito" });
  } catch (error) {
    console.error("Error al procesar la solicitud de soporte:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
