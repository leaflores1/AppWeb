import axios from 'axios';
import { API_URL } from "../config";

export const followUser = async (followerUsername, followedUsername) => {
  if (!followerUsername || !followedUsername) {
    throw new Error("Faltan parámetros requeridos.");
  }

  try {
    const response = await axios.post(
      `${API_URL}/api/follow/follow`,
      { followerUsername, followedUsername },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error al seguir usuario:', error.response?.data || error.message);
    throw error;
  }
};

export const unfollowUser = async (followerUsername, followedUsername) => {
  if (!followerUsername || !followedUsername) {
    throw new Error("Faltan parámetros requeridos.");
  }

  try {
    const response = await axios.post(`${API_URL}/api/follow/unfollow`, {
      followerUsername,
      followedUsername,
    });
    return response.data;
  } catch (error) {
    console.error('Error al dejar de seguir usuario:', error.response?.data || error.message);
    throw error;
  }
};

export const checkFollowStatus = async (followerUsername, followedUsername) => {
  if (!followerUsername || !followedUsername) {
    throw new Error("Faltan parámetros requeridos.");
  }

  try {
    const response = await axios.get(`${API_URL}/api/follow/status/${followerUsername}/${followedUsername}`);
    return response.data; // Se espera un formato { isFollowing: true/false }
  } catch (error) {
    console.error('Error al verificar estado de seguimiento:', error.response?.data || error.message);
    throw error;
  }
};

