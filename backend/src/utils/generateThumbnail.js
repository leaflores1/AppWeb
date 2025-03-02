import ffmpeg from "fluent-ffmpeg";
//import AWS from "aws-sdk";
import { S3Client } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_PUBLIC_BUCKET = "localhost:3000aws";     // localhost:3000aws
const AWS_PRIVATE_BUCKET = "localhost:3000aws-private";   // localhost:3000aws-private
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;


const s3 = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_PUBLIC_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

/**
 * Extrae un fotograma inicial del video y le aplica blur.
 * @param {string} videoPath - Ruta temporal del video en el servidor.
 * @param {string} videoId - ID único del video para nombrar la miniatura.
 * @returns {Promise<string>} - Retorna la URL pública de la miniatura.
 */
export async function generateBlurredThumbnail(videoPath, videoId) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(__dirname, `temp/${videoId}-blur.jpg`);

    ffmpeg(videoPath)
      .screenshots({
        timestamps: ["00:00:01"], // Extrae del primer segundo del video
        filename: `${videoId}-original.jpg`,
        folder: "temp/",
        size: "320x180",
      })
      .on("end", () => {
        ffmpeg(`temp/${videoId}-original.jpg`)
          .output(outputFile)
          .videoFilters("gblur=sigma=20") // Aplica desenfoque
          .on("end", async () => {
            const thumbnailUrl = await uploadThumbnailToS3(outputFile, videoId);
            resolve(thumbnailUrl);
          })
          .on("error", (err) => reject(err))
          .run();
      })
      .on("error", (err) => reject(err))
      .run();
  });
}

/**
 * Sube la miniatura desenfocada al bucket público de S3.
 * @param {string} thumbnailPath - Ruta del archivo generado.
 * @param {string} videoId - ID único del video.
 * @returns {Promise<string>} - URL pública de la miniatura.
 */
async function uploadThumbnailToS3(thumbnailPath, videoId) {
  const fileContent = fs.readFileSync(thumbnailPath);
  const params = {
    Bucket: process.env.AWS_PUBLIC_BUCKET,
    Key: `thumbnails/${videoId}-blur.jpg`,
    Body: fileContent,
    ContentType: "image/jpeg",
    ACL: "public-read",
  };

  const data = await s3.upload(params).promise();
  return data.Location; // Retorna la URL pública de la miniatura
}
