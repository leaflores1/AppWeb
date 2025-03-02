import { Router } from "express";
import { Photo } from "../models/photo.model.js";
import { auth } from "../middlewares/auth.middleware.js";
import { Notification } from "../models/notification.model.js";
import {User} from "../models/user.model.js"
import mongoose from "mongoose";
import { createAndEmitNotification } from "../controllers/noti.controller.js";

const router = Router();

router.put('/:id/like', auth, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!userId) {
    return res.status(400).json({ error: "userId es requerido" });
  }  

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "ID no válido" });
  }

  try {
    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ error: "Publicación no encontrada" });
    }

    const hasLiked = photo.likes.some((like) => like.toString() === userId.toString());
    if (hasLiked) {
      photo.likes = photo.likes.filter((like) => like.toString() !== userId.toString());
    } else {
      photo.likes.push(userId);

      const sender = await User.findById(userId);
      if (!sender) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
      
      // Solo emitir notificación si el dueño de la foto es distinto
      if (photo.userId.toString() !== userId.toString()) {
        const recipientUser = await User.findById(photo.userId);
        await createAndEmitNotification({
          recipient: photo.userId,
          sender: userId,
          type: "like",
          referenceId: id,
          recipientUsername: recipientUser.username,
          mediaType: photo.mediaType,
        }, req.io);
      }
    }

    await photo.save();
    res.status(200).json({
      likes: photo.likes,
      likedByUser: !hasLiked,
    });
  } catch (error) {
    console.error("Error al procesar la acción de like/unlike:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});


export default router;
