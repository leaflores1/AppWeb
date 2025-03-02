import express from "express";
import { User } from "../models/user.model.js";
import { Photo } from "../models/photo.model.js";
import { Album } from "../models/album.model.js";
//import { Comment } from "../models/photo.model.js";  // Suponiendo que los comentarios están embebidos en Photo
import { Report } from "../models/report.model.js";
import { Notification } from "../models/notification.model.js";
import { Follow } from "../models/follow.model.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.delete("/delete-account", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Eliminar fotos del usuario
    await Photo.deleteMany({ userId });

    // Eliminar álbumes y sus fotos
    const userAlbums = await Album.find({ userId });
    const albumPhotoIds = userAlbums.flatMap(album => album.photos);
    await Photo.deleteMany({ _id: { $in: albumPhotoIds } });
    await Album.deleteMany({ userId });

    // Eliminar notificaciones relacionadas con el usuario
    await Notification.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // Eliminar seguimientos (followers/following)
    await Follow.deleteMany({ $or: [{ followerUsername: userId }, { followedUsername: userId }] });

    // Eliminar reportes relacionados con el usuario
    await Report.deleteMany({ $or: [{ reporterId: userId }, { itemId: userId, itemType: "user" }] });

    // Eliminar al usuario
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Cuenta eliminada con éxito." });
  } catch (error) {
    console.error("Error al eliminar la cuenta:", error);
    res.status(500).json({ error: "Error interno al eliminar la cuenta." });
  }
});



// Endpoint público: devuelve id, username y photo
router.get("/public", async (req, res) => {
  try {
    // Selecciona solo los campos públicos
    const users = await User.find({}, { username: 1, photo: 1 });
    res.json(users);
  } catch (error) {
    console.error("Error al obtener usuarios públicos:", error);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
});



export default router;
