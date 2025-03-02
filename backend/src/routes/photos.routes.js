import { Router } from "express";
import { uploadFile, deleteFile } from "../s3.js";
import { Photo } from "../models/photo.model.js"; //modelo de DB
import { User } from "../models/user.model.js";
import { auth } from "../middlewares/auth.middleware.js";
import { v4 as uuidv4 } from "uuid";
import { postPhotos } from "../controllers/photoPost.controller.js";
import { getGallery, getPosts, getPhotoId, thumbnail, getPaidPhotoUrl } from "../controllers/photoGet.controller.js";

//Se crea una instancia del router de Express que contendrá las rutas de la API.
const router = Router();

//------------GET-----------------
router.get("/user/:username/gallery", auth, getGallery);

router.get("/user/:username/posts", auth, getPosts);

router.get("/:photoId", getPhotoId);

router.get("/thumbnail/:photoId", thumbnail)

router.get("/:photoId/url", auth, getPaidPhotoUrl);

//---------------POST----------------

router.post("/upload/:username/:category", auth, postPhotos);

//-------------PUT----------------------

router.put("/:username/update-profile", auth, async (req, res) => {
  try {
    const { username } = req.params;
    const { description } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    let photoUrl = user.photo;

    if (req.file) {
      // Subir nueva foto a S3
      const result = await uploadFile(req.file);
      photoUrl = result.Location; // URL pública de la foto subida
    }

    // Actualizar los datos del usuario en la base de datos
    user.photo = photoUrl;
    user.description = description || user.description;
    await user.save();

    res.status(200).json({
      photo: photoUrl,
      description: user.description,
      message: "Perfil actualizado correctamente (msj del back)",
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// ------Ruta para eliminar una foto -------------------------------------
router.delete("/delete/:photoId", async (req, res) => {
  try {
    const { photoId } = req.params;

    // Encontrar la foto en la base de datos
    const photo = await Photo.findById(photoId);

    if (!photo) {
      return res.status(404).send("Foto no encontrada");
    }

    // Eliminar el archivo de S3
    await deleteFile(photo.fileName);

    // Eliminar la foto de la base de datos
    await Photo.findByIdAndDelete(photoId);

    res.status(200).send("Foto eliminada con éxito");
  } catch (error) {
    console.error("Error al eliminar la foto:", error);
    res.status(500).send("Error al eliminar la foto");
  }
});

export default router;
