import { Notification } from "../models/notification.model.js";
import { Photo } from "../models/photo.model.js";
import { createAndEmitNotification } from "./noti.controller.js";
import { User } from '../models/user.model.js';

// Agregar comentario a una foto
export const addCommentToPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;
    const { text } = req.body; // El comentario que ingresa el usuario

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "El comentario no puede estar vacío." });
    }

    // Buscar la foto
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ message: "Foto no encontrada." });
    }

    // Añadir el nuevo comentario al array
    const newComment = {
      user: req.user.id, // gracias al middleware 'auth'
      text,
    };

    photo.comments.push(newComment);
    await photo.save();

 // Crear notificación para el propietario de la foto
 if (photo.userId.toString() !== req.user.id) {
 // Obtener el usuario destinatario para tener su username (para la sala)
 const recipientUser = await User.findById(photo.userId);

 await createAndEmitNotification({
   recipient: photo.userId,
   sender: req.user.id,
   type: "comment",
   referenceId: photo._id,
   recipientUsername: recipientUser.username,
   mediaType: photo.mediaType,
 }, req.io);

}

    // (Opcional) Popular los datos del usuario que comentó (username y foto)
    // para responder con la info ya actualizada
    await photo.populate("comments.user", "username photo");

    return res.status(200).json(photo.comments);
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};


export const getCommentsFromPhoto = async (req, res) => {
  try {
    const { photoId } = req.params;

    const photo = await Photo.findById(photoId).populate("comments.user", "username photo");
    if (!photo) {
      return res.status(404).json({ message: "Foto no encontrada." });
    }

    return res.json(photo.comments);
  } catch (error) {
    console.error("Error al obtener comentarios:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};
