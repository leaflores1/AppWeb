// feed.routes.js
import { Router } from "express";
import { Photo } from "../models/photo.model.js";
import { Follow } from "../models/follow.model.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const { username, id: currentUserId } = req.user;
    //console.log("Usuario autenticado:", username);

    // 1. Obtener los usuarios que sigue el usuario autenticado
    const follows = await Follow.find({ followerUsername: username }).select("followedUsername");
    const followingUserIds = follows.map((follow) => follow.followedUsername);

    // 2. Agregar el usuario autenticado a la lista de IDs
    const userIdsToFetch = [...followingUserIds, username]; // Incluye las propias fotos

    //console.log("Usuarios seguidos (incluido el propio):", userIdsToFetch);

    // 3. Obtener las fotos, EXCLUYENDO las que estén en "albums"
    const photos = await Photo.find({
      username: { $in: userIdsToFetch },
      category: { $ne: "albums" } // ← EXCLUIR "albums"
    })
      .populate("userId", "username photo")
      .sort({ createdAt: -1 });

    // 4. Modificar las fotos según la lógica de desbloqueo
    const processedPhotos = photos.map((photo) => {
      const isOwner = photo.userId && photo.userId._id.toString() === currentUserId;
      return {
        ...photo._doc,
        isUnlocked:
          photo.unlockedBy?.some((id) => id.toString() === currentUserId) ||
          !photo.price,
      };
    });

    //console.log("Fotos procesadas (sin albums):", processedPhotos);

    // 5. Devolver las fotos
    return res.status(200).json(processedPhotos);
  } catch (error) {
    console.error("Error al obtener el feed:", error);
    res.status(500).json({ error: "Error al obtener el feed" });
  }
});

export default router;
