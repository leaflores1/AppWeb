// utils/utils.js

/**
 * Crea y retorna una promesa que se resuelve con un objeto Image cargado.
 * Se establece crossOrigin a 'anonymous' para evitar problemas de CORS.
 *
 * @param {string} url - La URL de la imagen.
 * @returns {Promise<HTMLImageElement>}
 */
export function createImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
    });
  }
  
  /**
   * Convierte un ángulo en grados a radianes.
   *
   * @param {number} degreeValue - El ángulo en grados.
   * @returns {number} El ángulo en radianes.
   */
  export function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
  }
  