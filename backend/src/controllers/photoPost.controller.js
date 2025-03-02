// controllers/photoPost.controller.js
import { uploadFile } from "../s3.js";
import { Photo } from "../models/photo.model.js";
import Seller from "../models/seller.model.js";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import fs from "fs";

export const postPhotos = async (req, res) => {
  try {
    const { username, category } = req.params;
    const { userId, price, description } = req.body;

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

  
// Si hay un seller vinculado, asignamos su moneda. Si no, mantenemos el que envió el frontend.
const currency = seller && seller.site_id ? currencyMapping[seller.site_id] : req.body.currency || "ARS";

//console.log(`📌 Moneda final asignada: ${currency} (Seller: ${seller ? seller.site_id : "Sin vincular"})`);

    // Comprobamos que se haya subido un archivo
    if (!req.files || !req.files.photo) {
      return res.status(400).send("No se subió ningún archivo");
    }

    const file = req.files["photo"];
    const uniqueFileName = `${uuidv4()}-${file.name}`;

    // Determinar si la foto/video es de pago
    const numericPrice = parseFloat(price)||0;
    const isPaidContent = numericPrice > 0;

    // Detectar si es un video
    const isVideo = file.mimetype.startsWith("video");
    const mediaType = isVideo ? "video" : "image";

    // -------------------------------------------
    // 1) FLUJO PARA VIDEO
    // -------------------------------------------
    if (isVideo) {
      // Subir el video directamente (sin redimensionar) al bucket adecuado
      await uploadFile(file, uniqueFileName, isPaidContent);

      // Si deseas almacenar la URL de S3 en la DB (ej. para debug),
      // igual no se la muestras públicamente si es pagado.
      // O pones s3Url: null si es de pago y manejas presigned URLs.
      const s3Url = !isPaidContent
        ? `https://${process.env.AWS_PUBLIC_BUCKET}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${uniqueFileName}`
        : null;

      const newPhoto = new Photo({
        userId,
        username,
        fileName: uniqueFileName,
        s3Url, // o null si es pagado
        category,
        price: numericPrice,
        description: description || "",
        mediaType,
        responsive: [], // Vacío para video
        unlockedBy: [],
        isPaidContent,
        currency,
      });

      await newPhoto.save();
      return res.json(newPhoto);
    }

    // -------------------------------------------
    // 2) FLUJO PARA IMÁGENES
    // -------------------------------------------
    //console.log("Formato detectado:", mediaType);

    let originalBuffer;
    if (file.data && file.data.length > 0) {
      originalBuffer = file.data;
    } else if (file.tempFilePath) {
      originalBuffer = fs.readFileSync(file.tempFilePath);
    } else {
      throw new Error("No se encontró información en el archivo (imagen).");
    }

    // Subir primero la imagen original
    const originalFileName = `${uuidv4()}-orig-${file.name}`;
    await uploadFile(file, originalFileName, isPaidContent);

    // Si es gratis, guardamos la URL pública.
   
    // (luego generas presigned URLs para mostrarla al comprador).
    const originalS3Url = !isPaidContent
      ? `https://${process.env.AWS_PUBLIC_BUCKET}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${originalFileName}`
      : null;

// -------------------------------------------------------------------------
    // BLOQUE DE CÓDIGO NUEVO: generar y subir la versión "blur" para contenido de pago
    // -------------------------------------------------------------------------
    let blurUrl = null;
    if (isPaidContent) {
      // Generar un buffer con blur (puedes ajustar el tamaño y nivel de blur)
      const blurBuffer = await sharp(originalBuffer)
        .resize({ width: 200 }) // resolución pequeña
        .blur(20) // nivel de blur
        .toBuffer();

      // Subir la versión blur SIEMPRE al bucket público (para que se pueda ver)
      const blurFileName = `${uuidv4()}-blur-${file.name}`;
      await uploadFile(
        {
          name: blurFileName,
          data: blurBuffer,
          tempFilePath: null,
        },
        blurFileName,
        false // => false para PUBLIC bucket (ACL: public-read)
      );

      blurUrl = `https://${process.env.AWS_PUBLIC_BUCKET}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${blurFileName}`;
    }
    // -------------------------------------------------------------------------

    // Procesar la imagen para generar versiones responsive
    const targetWidths = [300, 600, 1200];
    const responsiveData = [];

    for (const width of targetWidths) {
      const resizedBuffer = await sharp(originalBuffer)
        .resize({ width, withoutEnlargement: true })
        .toBuffer();

      const resizedFileName = `${uuidv4()}-${width}-${file.name}`;
      await uploadFile(
        {
          name: resizedFileName,
          data: resizedBuffer,
          tempFilePath: null,
        },
        resizedFileName,
        isPaidContent
      );

      // Si es gratis => URL pública; si es pago => null
      const resizedS3Url = !isPaidContent
        ? `https://${process.env.AWS_PUBLIC_BUCKET}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${resizedFileName}`
        : null;

      responsiveData.push({
        width,
        url: resizedS3Url, // null si es pagado
      });
    }

    // Crear el documento en la base de datos
    const photoDoc = new Photo({
      userId,
      username,
      fileName: originalFileName,
      s3Url: originalS3Url, // null si es pago
      category,
      price: numericPrice,
      description: description || "",
      mediaType,
      responsive: responsiveData,
      unlockedBy: [],
      isPaidContent,
      blurUrl, 
      currency,
    });

    //console.log("DEBUG precio recibido:", req.body.price);
    //console.log("numericPrice calculado:", numericPrice);
    //console.log("isPaidContent:", isPaidContent);
    

    await photoDoc.save();
    return res.json(photoDoc);
  } catch (error) {
    console.error("Error al subir y procesar la imagen:", error);
    res.status(500).send("Error al subir y procesar la imagen");
  }
};