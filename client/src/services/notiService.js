import axios from 'axios';
import { API_URL } from "../config";

export const getNotifications = async (username) => {
  try {
    const response = await axios.get(`${API_URL}/api/noti/notifications/${username}`);
    return response.data.map((notif) => ({
      ...notif,
      message: notif.type === "follow"
        ? `${notif.senderUsername} empezó a seguirte`
        : notif.type === "like"
        ? `${notif.senderUsername} le dio like a tu publicación`
        : `${notif.senderUsername} comentó tu publicación`,
    }));
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    throw error;
  }
};
