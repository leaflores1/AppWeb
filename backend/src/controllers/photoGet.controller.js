import { Photo } from "../models/photo.model.js";
import { User } from "../models/user.model.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/**
 * GALERÍA → /api/photos/user/:username/gallery
 */

import dotenv from "dotenv";

dotenv.config();

const AWS_PRIVATE_BUCKET = "localhost:3000aws-private";
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;

const s3 = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

/**
 * GALERÍA → /api/photos/user/:username/gallery
 *
 * - Muestra fotos con category="gallery".
 * - Bloquea acceso si hay problemas de bloqueo mutuo.
 * - Para fotos gratis (isPaidContent=false), photo.s3Url contendrá un enlace público de S3.
 * - Para fotos pagas (isPaidContent=true), normalmente s3Url es null (o no se expone).
 */
export const getGallery = async (req, res) => {
  try {
    const { username } = req.params;

    // 1) Verificar que el dueño del perfil exista
    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 2) Si no hay usuario logueado (req.user no existe),
    //    retornamos las fotos sin revisar bloqueos.
    if (!req.user) {
      const photos = await Photo.find({
        username,
        category: "gallery",
      }).populate("userId", "username photo");

      // Para cada foto, si es gratis (isPaidContent=false), s3Url tiene
      // un enlace público. Si es paga, s3Url suele ser null.
      // Retornamos tal cual estén en la DB.
      return res.json(photos);
    }

    // 3) Usuario logueado => revisar bloqueos
    const visitor = await User.findById(req.user.id);
    if (!visitor) {
      return res.status(401).json({ error: "Usuario logueado no encontrado" });
    }

    // a) ¿El dueño ha bloqueado al visitante?
    if (profileOwner.blockedUsers.includes(visitor._id)) {
      return res.status(403).json({ error: "Este usuario te ha bloqueado" });
    }

    // b) ¿El visitante ha bloqueado al dueño?
    if (visitor.blockedUsers.includes(profileOwner._id)) {
      return res.status(403).json({
        error: "Has bloqueado a este usuario; no puedes ver su galería",
      });
    }

    // 4) Retornar fotos de categoría "gallery"
    const photos = await Photo.find({ username, category: "gallery" }).populate(
      "userId",
      "username photo"
    );

    // Observación: Si la foto es paga (isPaidContent=true), normalmente
    // photo.s3Url será null y no se expondrá. Si es gratis, photo.s3Url
    // contiene el link público. Aquí no forzamos price=0 ni nada, porque
    // la galería se asume que puede ser mayormente gratis o un mix.
    // Simplemente devolvemos lo que está en la base de datos.
    return res.json(photos);
  } catch (error) {
    console.error("Error en galería:", error);
    return res.status(500).json({ error: "Error interno en la galería" });
  }
};

/**
 * POSTS → /api/photos/user/:username/posts
 * - No forzamos price=0 para el dueño en la lista; de lo contrario, perderíamos el overlay.
 * - Solo price=0 si el visitante ya lo compró.
 */
export const getPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const profileOwner = await User.findOne({ username });
    if (!profileOwner) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const visitor = await User.findById(req.user.id);
    if (!visitor) {
      return res
        .status(401)
        .json({ message: "Usuario autenticado no encontrado" });
    }

    // Bloqueos
    if (profileOwner.blockedUsers.includes(visitor._id)) {
      return res
        .status(403)
        .json({ error: "El dueño de estos posts te ha bloqueado" });
    }
    if (visitor.blockedUsers.includes(profileOwner._id)) {
      return res.status(403).json({
        error: "Has bloqueado a este usuario; no puedes ver sus posts",
      });
    }

    // Buscar las fotos con category="posts"
    const photos = await Photo.find({ username, category: "posts" }).populate(
      "userId",
      "username photo"
    );

    // Mapeamos para setear price=0 en caso de que el visitor la haya desbloqueado,
    // o si es dueño.
    const unlockedSet = new Set(
      visitor.unlockedPhotos.map((id) => id.toString())
    );

    const postsData = photos.map((photo) => {
      const doc = photo.toObject();

     // 🔹 Si es el dueño, no modificamos price
     if (doc.userId._id.toString() !== visitor._id.toString()) {
      // 🔹 Si la ha comprado, le ponemos `price=0`
      if (unlockedSet.has(doc._id.toString())) {
        doc.price = 0;
      }
    }

      // s3Url para fotos pagas es null, para gratis es un link público
      // No modificamos doc.s3Url, se queda como está en DB.
      return doc;
    });

    return res.json(postsData);
  } catch (error) {
    console.error("Error al obtener posts:", error);
    return res.status(500).send("Error interno al obtener posts");
  }
};

/**
 * DETALLE DE FOTO → /api/photos/:photoId
 *
 * - Si la foto es paga (isPaidContent=true) y no está desbloqueada, se mantiene price>0 y s3Url=null.
 * - Si el visitor es el dueño o la compró => price=0, s3Url=null si es paga.
 */
export const getPhotoId = async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId).populate(
      "userId",
      "username photo"
    );

    if (!photo) {
      return res.status(404).json({ message: "Foto no encontrada" });
    }


    // 🔍 Verificar si el currency en la base de datos es correcto antes de enviarlo
    //console.log(`📸 Foto obtenida: ${photo.fileName}, Moneda en DB: ${photo.currency}`);

    // Usuario anónimo => devolvemos tal cual
    if (!req.user) {
      return res.json(photo);
    }

    // Revisar si el usuario logueado es el dueño o si la ha comprado
    const visitor = await User.findById(req.user.id);
    if (!visitor) {
      return res.json(photo);
    }

    const doc = photo.toObject();

    // Forzamos price=0 si es el dueño
    if (photo.userId._id.toString() === visitor._id.toString()) {
      doc.price = 0;
    } else {
      // Si la ha comprado
      const hasUnlocked = visitor.unlockedPhotos.some(
        (id) => id.toString() === photo._id.toString()
      );
      if (hasUnlocked) {
        doc.price = 0;
      }
    }

    return res.json(doc);
  } catch (error) {
    console.error("Error al obtener la foto:", error);
    return res.status(500).json({ message: "Error interno" });
  }
};

/**
 * Thumbnail → /api/photos/thumbnail/:photoId
 *
 * - Si la foto es gratis (isPaidContent=false), podemos redirigir a doc.s3Url (si no es null).
 * - Si la foto es paga, no redirigimos a nada público. Podrías generar una presigned URL
 *   si el usuario la desbloqueó, o devolver 403 en caso contrario.
 */
export const thumbnail = async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).send("Foto no encontrada");
    }

    // Foto gratis => redirigir a s3Url si existe
    if (!photo.isPaidContent && photo.s3Url) {
      return res.redirect(photo.s3Url);
    }

    // Foto paga => devuelves 403 o un presigned URL si la persona
    // en req.user la tiene desbloqueada. Aquí, por simplicidad, 403:
    return res.status(403).send("Esta foto es de pago. Usa presigned URL.");
  } catch (error) {
    console.error("Error al obtener la miniatura:", error);
    return res.status(500).send("Error interno");
  }
};

/**
 * GET /api/photos/:photoId/url
 * Retorna un Presigned URL si el usuario es dueño o la ha desbloqueado.
 */
export const getPaidPhotoUrl = async (req, res) => {
  try {
    const { photoId } = req.params;
    //console.log(`📸 Solicitando URL firmada para la foto: ${photoId}`);

    const photo = await Photo.findById(photoId).populate("userId", "username");
    if (!photo) {
      console.error(`❌ Foto no encontrada en la BD: ${photoId}`);
      return res.status(404).json({ error: "Foto no encontrada" });
    }

    //console.log(`🔹 Foto encontrada: ${photo.fileName}`);

    if (!photo.isPaidContent) {
      if (photo.s3Url) {
        //console.log(`✅ Foto gratuita. Retornando URL pública.`);
        return res.json({ url: photo.s3Url });
      } else {
        console.error("❌ Foto gratis sin URL.");
        return res.status(400).json({ error: "Foto gratis sin URL." });
      }
    }

    if (!req.user) {
      console.error("❌ Usuario no autenticado.");
      return res.status(401).json({ error: "No autenticado" });
    }

    const visitor = await User.findById(req.user.id);
    if (!visitor) {
      console.error("❌ Usuario autenticado no encontrado.");
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    //console.log(`👤 Usuario autenticado: ${visitor.username} (${visitor._id})`);

    //console.log("🔹 Archivo en BD:", photo.fileName);
    //console.log("🔹 Archivo en S3:", photo.s3Url);
    //console.log("📌 Bucket usado:", AWS_PRIVATE_BUCKET);

    const isOwner = photo.userId._id.toString() === visitor._id.toString();

    const hasUnlocked = visitor.unlockedPhotos.map(id => id.toString()).includes(photoId.toString());

    if (!isOwner && !hasUnlocked) {
      console.error("⛔ Acceso denegado: No es dueño ni ha comprado la foto.");
      return res
        .status(403)
        .json({ error: "No tienes acceso a esta foto. Debes comprarla." });
    }

    //console.log(`✅ Acceso autorizado. Generando URL firmada...`);

    if (!photo.fileName) {
      console.error("❌ El archivo en la BD no tiene un fileName válido.");
      return res
        .status(400)
        .json({ error: "Archivo sin nombre en la base de datos" });
    }

    try {
      const command = new GetObjectCommand({
        Bucket: AWS_PRIVATE_BUCKET,
        Key: photo.fileName,
      });

      const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      //console.log(`✅ Presigned URL generada: ${presignedUrl}`);
      return res.json({ url: presignedUrl });
    } catch (s3Error) {
      console.error("❌ Error al generar la URL firmada de S3:", s3Error);
      return res
        .status(500)
        .json({ error: "Error interno al generar URL firmada" });
    }
  } catch (error) {
    console.error("❌ Error en `getPaidPhotoUrl`:", error);
    return res
      .status(500)
      .json({ error: "Error interno al procesar la solicitud" });
  }
};