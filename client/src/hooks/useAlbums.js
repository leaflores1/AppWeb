// hooks/useAlbums.js
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

export function useAlbums(username) {
  const [albums, setAlbums] = useState([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/albums/user/${username}`, {
          withCredentials: true,
        });
        setAlbums(response.data);
      } catch (error) {
        console.error("Error al obtener álbums:", error);
      } finally {
        setLoadingAlbums(false);
      }
    };
    if (username) {
      fetchAlbums();
    }
  }, [username]);

  return { albums, setAlbums, loadingAlbums };
}
