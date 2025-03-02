import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const usePhotos = (username, category) => {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/photos/user/${username}/${category}`,
          {
            withCredentials: true,
          }
        );
        //console.log("📡 Respuesta de la API de fotos:", response.data);
        setPhotos(response.data);
      } catch (error) {
        console.error("Error al obtener fotos:", error);
      }
    };

    fetchPhotos();
  }, [username, category]);

  return { photos, setPhotos };
};