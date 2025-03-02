import { Router } from "express";
import { uploadFile, getFileUrl} from '../s3.js';
import { User } from "../models/user.model.js";
import { optionalAuth } from "../middlewares/optionalAuth.js";



// Se crea una instancia del router de Express que contendrá las rutas de la API.
const router = Router();

// Ruta GET Obtener las fotos de un usuario
router.get("/:username", optionalAuth, async (req, res) => {
  try {
    const { username } = req.params;
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Si no hay req.user, es un usuario anónimo (no logueado).
    // Decides si mostrar el perfil igual o no:
    if (!req.user) {
      // ← USUARIO NO LOGUEADO
      // Muestra el perfil sin lógica de bloqueos
      return res.json({
        _id: profileOwner._id,
        nombre: profileOwner.nombre,
        username: profileOwner.username,
        instagram: profileOwner.instagram,
        photo: profileOwner.photo || "/foto.jpeg",
        description: profileOwner.description || "",
        followers: profileOwner.followers || [],
        following: profileOwner.following || [],
      });
    }

    // Si llega aquí, HAY un usuario logueado (req.user)
    const visitor = req.user; // Este es el usuario autenticado
    const visitorId = visitor._id.toString();
    const ownerId = profileOwner._id.toString();

    // Si es su propio perfil:
    if (visitorId === ownerId) {
      return res.json({
        _id: profileOwner._id,
        nombre: profileOwner.nombre,
        username: profileOwner.username,
        instagram: profileOwner.instagram,
        photo: profileOwner.photo || "/foto.jpeg",
        description: profileOwner.description || "",
        followers: profileOwner.followers || [],
        following: profileOwner.following || [],
      });
    }

    // Revisa bloqueos
    // a) El dueño bloqueó al visitante
    if (profileOwner.blockedUsers?.includes(visitorId)) {
      return res.status(403).json({ error: "No puedes ver este perfil (te han bloqueado)" });
    }

    // b) El visitante bloqueó al dueño
    if (visitor.blockedUsers?.includes(ownerId)) {
      return res.status(403).json({ error: "No puedes ver este perfil (tú lo bloqueaste)" });
    }

    // Si no hay bloqueo, se muestra
    return res.json({
      _id: profileOwner._id,
      nombre: profileOwner.nombre,
      username: profileOwner.username,
      instagram: profileOwner.instagram,
      photo: profileOwner.photo || "/foto.jpeg",
      description: profileOwner.description || "",
      followers: profileOwner.followers || [],
      following: profileOwner.following || [],
    });
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

//-------------PUT----------------------
router.put("/upload/:username/update-profile", async (req, res) => {
  try {
    console.log("Iniciando actualización de perfil...");

    const { username } = req.params;

    // Extraer estos campos del body
    const description = req.body.description || ""; 
    const nombre = req.body.nombre || "";          // ← NUEVO
    const file = req.files?.photo; 
    const instagram = req.body.instagram || "";

    //console.log("Usuario:", username);
    //console.log("Nombre actualizado:", nombre);
    //console.log("Descripción actualizada:", description);
    //console.log("Instagram actualizado:", instagram);

    let updateData = { description, nombre, instagram }; // ← NUEVO

    if (file) {
      //console.log("Archivo recibido para subir:", file.name);
      await uploadFile(file);
      const fileUrl = await getFileUrl(file.name);
      //console.log("Archivo subido a S3 con URL:", fileUrl);

      // Agrega al objeto de actualización
      updateData.photo = fileUrl;
    }

    // Actualizar en la base de datos
    const updatedUser = await User.findOneAndUpdate(
      { username },
      updateData,
      { new: true }
    );
 
    if (!updatedUser) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    //console.log("Usuario actualizado en la base de datos:", updatedUser);

    // Responder con los campos relevantes
    return res.status(200).json({
      nombre: updatedUser.nombre,
      photo: updatedUser.photo,
      description: updatedUser.description,
      instagram:  updatedUser.instagram,
    });
  } catch (error) {
    console.error("Error actualizando el perfil:", error);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
});

// GET /api/profile/:username/followers
router.get("/:username/followers", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate("followers", "username photo"); 
    // la clave: populate("followers", "username photo") → trae info de cada follower

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // user.followers aquí es un array de objetos User
    // Retornamos la lista de followers con datos básicos
    const followersData = user.followers.map((f) => ({
      username: f.username,
      photo: f.photo,
    }));

    return res.json(followersData);
  } catch (error) {
    console.error("Error al obtener seguidores:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// GET /api/profile/:username/following
router.get("/:username/following", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).populate("following", "username photo");

    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const followingData = user.following.map((f) => ({
      username: f.username,
      photo: f.photo,
    }));

    return res.json(followingData);
  } catch (error) {
    console.error("Error al obtener seguidos:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});



export default router;


