// useProfile.js
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export const useProfile = (username) => {
  const [profileData, setProfileData] = useState({
    // Agrega _id con valor inicial null (o cadena vacía)
    _id: null,
    nombre: "",
    username: "",
    instagram: "",
    photo: "/foto.jpeg",
    description: "",
    followers: 0,
    following: 0,
  });

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/profile/${username}`, {
        withCredentials: true,
      });

      //console.log("useProfile -> /api/profile/:username OK", response.data);
    
      setProfileData({
        // Asigna el _id que viene de la respuesta
        _id: response.data._id || null,
        nombre: response.data.nombre,
        username: response.data.username,
        instagram: response.data.instagram || "",
        photo: response.data.photo || "/foto.jpeg",
        description: response.data.description || "",
        followers: Array.isArray(response.data.followers)
          ? response.data.followers.length
          : 0,
        following: Array.isArray(response.data.following)
          ? response.data.following.length
          : 0,
      });
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
    }
  };

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  return { profileData, setProfileData, fetchProfile };
};
