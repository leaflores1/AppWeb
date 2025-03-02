import axios from "axios";
import { API_URL } from "../config";

export const deleteAlbum = async (albumId) => {
  if (typeof albumId !== "string") {
    throw new Error("El ID del álbum debe ser un string válido.");
  }

  try {
    const response = await axios.delete(`${API_URL}/api/albums/delete/${albumId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el álbum:", error);
    throw error;
  }
};
