// utils/cropImage.js
import { createImage, getRadianAngle } from './utils/utils';

export default async function getCroppedImg(file, croppedAreaPixels) {
  // Crea un objeto Image a partir de la URL del archivo
  const image = await createImage(URL.createObjectURL(file));
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Ajusta el canvas al tamaño del área recortada
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;

  // Dibuja la porción recortada en el canvas
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  // Convierte el canvas a Blob y lo envuelve en un File
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      const fileName = `cropped-${file.name}`;
      const croppedFile = new File([blob], fileName, { type: file.type });
      resolve(croppedFile);
    }, file.type, 1);
  });
}