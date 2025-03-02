// services/photoService.js
import axios from "axios";
import { API_URL } from "../config";

// Función para desbloquear fotos
export const unlockPhoto = async (photo) => {
  if (!photo || !photo.price) {
    console.error("Foto no válida o sin precio.");
    return;
  }

  try {
    const response = await axios.post(
      `${API_URL}/create-order`,
      {
        photoId: photo._id,
        title: "Desbloquear Foto",
        unit_price: photo.price,
        quantity: 1,
        marketplace_fee: parseFloat((photo.price * 0.01).toFixed(2)),
        amount: photo.price,
      },
      {
        withCredentials: true,
      }
    );

    const { init_point } = response.data;
    window.location.href = init_point; // Redirige a Mercado Pago
  } catch (error) {
    console.error("Error al crear la orden:", error);
  }
};

// Función para eliminar fotos
export const deletePhoto = async (photoId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/photos/delete/${photoId}`);
    return response.status === 200;
  } catch (error) {
    console.error("Error al eliminar foto:", error);
    return false;
  }
};
