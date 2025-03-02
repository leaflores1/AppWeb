// routes/albums.routes.js
import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { Photo } from "../models/photo.model.js";
import { Album } from "../models/album.model.js";
import { uploadFile } from "../s3.js";
import { User } from "../models/user.model.js";
import { v4 as uuidv4 } from "uuid";
import Seller from "../models/seller.model.js";

const router = Router();

/**
 * POST /api/albums/create
 * Crea un nuevo Álbum subiendo múltiples fotos/videos.
 * - Si 'price' > 0 => contenido de pago => bucket privado, s3Url=null
 * - Si 'price' === 0 => contenido gratis => bucket público, s3Url con enlace
 */
router.post("/create", auth, async (req, res) => {
  try {
    const { userId, title, price, description } = req.body;

    // Buscar el usuario en la base de datos
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    // Buscar usuario y validar si está vinculado a Mercado Pago
    const seller = userId ? await Seller.findOne({ sellerId: userId }) : null;

    // Mapeo de site_id a moneda
    const currencyMapping = {
      "MLA": "ARS", // Argentina
      "MLB": "BRL", // Brasil
      "MLC": "CLP", // Chile
      "MCO": "COP", // Colombia
      "MLM": "MXN", // México
      "MPE": "PEN", // Perú
      "MLU": "UYU", // Uruguay
    };

   // Definir la moneda (default "ARS" si no hay seller)
   const currency = seller ? currencyMapping[seller.site_id] || "ARS" : "ARS";
   //console.log(`📌 Moneda asignada: ${currency} (Seller: ${seller ? seller.site_id : "Sin vincular"})`);


    const numericPrice = parseFloat(price) || 0;
    const isPaidAlbum = numericPrice > 0;

    // Verificar que se hayan subido archivos
    if (!req.files || !req.files["photos"]) {
      return res
        .status(400)
        .json({ error: "No se subieron archivos (photos) para el álbum." });
    }

    // Normalizar "photos" en array
    const files = Array.isArray(req.files["photos"])
      ? req.files["photos"]
      : [req.files["photos"]];

    const photoIds = [];

    // Subir y crear un Photo por cada file
    for (const file of files) {
      const isVideo = file.mimetype.startsWith("video");
      const mediaType = isVideo ? "video" : "image";

      // Generar nombre único (puedes usar uuidv4())
      const uniqueName = `${uuidv4()}-${file.name}`;

      // Subir al bucket público/privado según price
      await uploadFile(file, uniqueName, isPaidAlbum);

      // Para fotos gratis => s3Url pública, para pagas => null
      const s3Url = !isPaidAlbum
        ? `https://${process.env.AWS_PUBLIC_BUCKET}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueName}`
        : null;

      // Crear Photo
      const newPhoto = new Photo({
        userId,
        username: user.username,
        fileName: uniqueName,
        s3Url,
        category: "albums",
        mediaType,
        isPaidContent: isPaidAlbum,
        price: numericPrice,
        unlockedBy: [],
        currency,
      });

      const savedPhoto = await newPhoto.save();
      photoIds.push(savedPhoto._id);
    }

    // Crear el Álbum en DB
    const newAlbum = new Album({
      userId,
      title,
      username: user.username,
      description: description || "",
      photos: photoIds,
      price: numericPrice,
      unlockedBy: [], // Nadie lo desbloqueó inicialmente
      likes: [],
      comments: [],
      currency,
    });

    await newAlbum.save();

    return res.status(201).json(newAlbum);
  } catch (error) {
    console.error("Error al crear álbum:", error);
    res.status(500).json({ error: "Error al crear álbum" });
  }
});

/**
 * GET /api/albums/user/:username
 * Retorna los álbumes de un usuario, revisando bloqueos.
 */
router.get("/user/:username", auth, async (req, res) => {
  try {
    const { username } = req.params;

    // Verificar que el usuario dueño exista
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Quien visita
    const visitor = await User.findById(req.user.id);
    if (!visitor) {
      return res
        .status(401)
        .json({ error: "Usuario autenticado no encontrado" });
    }

    // Revisar bloqueos
    if (profileOwner.blockedUsers.includes(visitor._id)) {
      return res
        .status(403)
        .json({ error: "El dueño de los álbumes te ha bloqueado" });
    }
    if (visitor.blockedUsers.includes(profileOwner._id)) {
      return res
        .status(403)
        .json({ error: "Has bloqueado a este usuario; no puedes ver sus álbumes" });
    }

    // Obtener álbumes
    const albums = await Album.find({ userId: profileOwner._id })
      .populate("photos")
      .populate("userId", "username photo");

    return res.json(albums);
  } catch (error) {
    console.error("Error al obtener álbums:", error);
    return res.status(500).json({ error: "Error interno al obtener álbums" });
  }
});

/**
 * GET /api/albums/:albumId
 * Devuelve el álbum con sus datos (fotos, likes, etc).
 */
router.get("/:albumId", async (req, res) => {
  try {
    const { albumId } = req.params;

    const album = await Album.findById(albumId)
      .populate("photos")
      .populate("likes", "username")
      .populate("comments.user", "username photo")
      .populate("userId", "username photo")
      

    if (!album) {
      return res.status(404).json({ error: "Álbum no encontrado" });
    }

    return res.json(album);
  } catch (error) {
    console.error("Error al obtener álbum:", error);
    return res.status(500).json({ error: "Error al obtener álbum" });
  }
});

/**
 * GET /api/albums/:albumId/comments
 * Obtener comentarios de un álbum.
 */
router.get("/:albumId/comments", async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId).populate(
      "comments.user",
      "username photo"
    );
    if (!album) {
      return res.status(404).json({ error: "Álbum no encontrado" });
    }
    res.json(album.comments);
  } catch (error) {
    console.error("Error al obtener comentarios de álbum:", error);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

/**
 * PUT /api/albums/:albumId/like
 * Da Like / quita Like a un álbum.
 */
router.put("/:albumId/like", auth, async (req, res) => {
  try {
    const { albumId } = req.params;
    const userId = req.user.id;

    const album = await Album.findById(albumId);
    if (!album) return res.status(404).json({ error: "Álbum no encontrado" });

    const alreadyLiked = album.likes.includes(userId);

    if (alreadyLiked) {
      album.likes = album.likes.filter((like) => like.toString() !== userId);
    } else {
      album.likes.push(userId);
    }

    await album.save();
    res.json(album.likes);
  } catch (error) {
    console.error("Error al dar like al álbum:", error);
    res.status(500).json({ error: "Error al dar like" });
  }
});

/**
 * POST /api/albums/:albumId/comments
 * Agrega un comentario al álbum
 */
router.post("/:albumId/comments", auth, async (req, res) => {
  try {
    const { albumId } = req.params;
    const { text } = req.body;

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ error: "Álbum no encontrado" });
    }

    const newComment = {
      user: req.user.id,
      text,
    };

    album.comments.push(newComment);
    await album.save();

    // Repoblar comentarios para retornar el array con datos de usuario
    const populatedAlbum = await Album.findById(albumId).populate(
      "comments.user",
      "username photo"
    );
    res.json(populatedAlbum.comments);
  } catch (error) {
    console.error("Error al agregar comentario:", error);
    res.status(500).json({ error: "Error al agregar comentario" });
  }
});

/**
 * DELETE /api/albums/delete/:albumId
 * Elimina un álbum (y las fotos que contiene).
 */
router.delete("/delete/:albumId", auth, async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await Album.findById(albumId);

    if (!album) {
      return res.status(404).json({ error: "Álbum no encontrado" });
    }

    // Verificar que quien elimina sea el dueño
    if (album.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Eliminar las fotos del álbum
    await Photo.deleteMany({ _id: { $in: album.photos } });

    // Finalmente, eliminar el álbum
    await Album.findByIdAndDelete(albumId);
    res.status(200).json({ message: "Álbum eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar álbum:", error);
    res.status(500).json({ error: "Error al eliminar álbum" });
  }
});

/**
 * PUT /api/albums/:albumId/unlock
 * Desbloquea un álbum de pago (simulación de compra),
 * añade userId a unlockedBy en el álbum y en cada foto del álbum que sea paga.
 */
router.put("/:albumId/unlock", auth, async (req, res) => {
  try {
    const { albumId } = req.params;
    const userId = req.user.id;

    const album = await Album.findById(albumId).populate("photos");
    if (!album) {
      return res.status(404).json({ error: "Álbum no encontrado" });
    }

    // Si el precio es 0 => no se bloquea
    if (album.price === 0) {
      return res
        .status(400)
        .json({ error: "Este álbum es gratuito, no requiere desbloqueo." });
    }

    // Revisar si ya está desbloqueado
    if (album.unlockedBy.includes(userId)) {
      return res.status(400).json({ error: "Ya has desbloqueado este álbum." });
    }

    // Agregar userId a album.unlockedBy
    album.unlockedBy.push(userId);

    // Además, si las fotos son de pago, también se añaden a cada photo.unlockedBy
    for (const photoId of album.photos) {
      const photo = await Photo.findById(photoId);
      if (!photo) continue;

       // ✅ SOLO desbloquear fotos que sean de pago

   if (photo.isPaidContent && !photo.unlockedBy.includes(userId)) {
      photo.unlockedBy.push(userId);
      await photo.save();
    }
  }

    await album.save();
    return res.json(album);
  } catch (error) {
    console.error("Error al desbloquear álbum:", error);
    res.status(500).json({ error: "Error al desbloquear álbum" });
  }
});

export default router;
