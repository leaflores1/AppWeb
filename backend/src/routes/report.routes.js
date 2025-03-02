// routes/report.routes.js
import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { Report } from "../models/report.model.js";
import { User } from "../models/user.model.js";

const router = Router();

router.post("/", auth, async (req, res) => {
    try {
      //console.log("Datos recibidos:", req.body);  // Agrega esta línea para depurar
      const { itemId, itemType,reason } = req.body;

      if (!itemId || !itemType || !reason) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }
  
      // Crear un reporte
      const newReport = new Report({
        itemId,
        itemType,
        reporterId: req.user.id,
        reason,
        status: "pending",
      });
      await newReport.save();
  
      return res.json({ message: "Reporte enviado con éxito" });
    } catch (error) {
      console.error("Error al reportar:", error);
      res.status(500).json({ error: "Error interno al reportar" });
    }
  });

  // Reportar perfil de usuario
router.post("/reportprofile", auth, async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({ error: "Usuario reportado no encontrado" });
    }

    const newReport = new Report({
      reporterId: req.user._id,
      itemId: reportedUserId,
      itemType: "user",
      reason,
      description,
    });

    await newReport.save();
    res.status(200).json({ message: "Reporte enviado exitosamente" });
  } catch (error) {
    console.error("Error al reportar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

  

export default router;
