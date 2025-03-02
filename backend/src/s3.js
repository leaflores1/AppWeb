import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const AWS_PUBLIC_KEY = process.env.AWS_PUBLIC_KEY;
const AWS_SECRET_KEY = process.env.AWS_SECRET_KEY;
const AWS_PUBLIC_BUCKET = process.env.AWS_PUBLIC_BUCKET ;     
const AWS_PRIVATE_BUCKET = process.env.AWS_PRIVATE_BUCKET;   
const AWS_BUCKET_REGION = process.env.AWS_BUCKET_REGION;


// Verificar que las credenciales estén definidas
if (!AWS_PUBLIC_KEY || !AWS_SECRET_KEY || !AWS_BUCKET_REGION) {
  throw new Error("Las credenciales de AWS no están configuradas correctamente en el .env");
}

const s3 = new S3Client({
  region: AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: AWS_PUBLIC_KEY,
    secretAccessKey: AWS_SECRET_KEY,
  },
});

/**
 * Sube un archivo a S3, eligiendo bucket público o privado según sea de pago o no.
 * @param {Object} file - El objeto que contiene `tempFilePath` o `data`.
 * @param {string} uniqueFileName - Nombre único que daremos en S3.
 * @param {boolean} isPaidContent - Indica si la foto es de pago (true) o gratuita (false).
 */
export async function uploadFile(file, uniqueFileName, isPaidContent) {
  const finalName = uniqueFileName || file.name;
 

  //console.log("Indica si la foto es de pago (true) o gratuita (false).", isPaidContent)

  
  
  //console.log(isPaidContent,bucketSelected: isPaidContent ? AWS_PRIVATE_BUCKET : AWS_PUBLIC_BUCKET,AWS_PRIVATE_BUCKET,AWS_PUBLIC_BUCKET});
  
  const bucketName = isPaidContent ? AWS_PRIVATE_BUCKET : AWS_PUBLIC_BUCKET;
  
  try {
    let bodyStream;

    if (file.tempFilePath) {
      //console.log(`Subiendo desde tempFilePath: ${file.tempFilePath}`);
      bodyStream = fs.createReadStream(file.tempFilePath);
    } else if (file.data) {
      //console.log(`Subiendo desde Buffer en memoria: ${finalName}`);
      bodyStream = file.data;
    } else {
      throw new Error("No se encontró tempFilePath ni data en el archivo para subir a S3.");
    }

    const uploadParams = {
      Bucket: bucketName,
      Key: finalName,
      Body: bodyStream,
    };

    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);

    return result;
  } catch (error) {
    //console.error("❌ Error subiendo el archivo a S3:", error);
    throw error;
  } finally {
    // Eliminar archivo temporal si existía
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      fs.unlinkSync(file.tempFilePath);
    }
  }
}

/**
 * Obtiene la URL pública o privada de un archivo en S3
 * @param {string} fileName - Nombre del archivo en S3
 * @param {boolean} isPaidContent - Define si es de pago (true) o gratuito (false)
 * @returns {string} - URL del archivo en S3
 */
export function getFileUrl(fileName, isPaidContent) {
  const bucketName = isPaidContent ? AWS_PRIVATE_BUCKET : AWS_PUBLIC_BUCKET;
  return `https://${bucketName}.s3.${AWS_BUCKET_REGION}.amazonaws.com/${fileName}`;
}

/**
 * Elimina un archivo de S3
 * @param {string} fileName - Nombre del archivo en S3
 * @param {boolean} isPaidContent - Define si es de pago (true) o gratuito (false)
 */
export async function deleteFile(fileName, isPaidContent) {
  try {
    const bucketName = isPaidContent ? AWS_PRIVATE_BUCKET : AWS_PUBLIC_BUCKET;

    const deleteParams = {
      Bucket: bucketName,
      Key: fileName,
    };

    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3.send(command);
    //console.log("✅ Archivo eliminado exitosamente de S3:", result);
  } catch (error) {
    //console.error("❌ Error eliminando el archivo de S3:", error);
    throw error;
  }
}
