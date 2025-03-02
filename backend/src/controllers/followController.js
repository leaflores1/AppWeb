import { Follow } from '../models/follow.model.js';
import { User } from '../models/user.model.js'; // Importa el modelo de usuario
import { Notification } from '../models/notification.model.js';
import { createAndEmitNotification } from "./noti.controller.js";

// Seguir a un usuario
export const followUser = async (req, res) => {
  const { followerUsername, followedUsername } = req.body;

  if (!followerUsername || !followedUsername) {
    return res.status(400).json({ message: "Faltan parámetros requeridos." });
  }

  try {
    const follower = await User.findOne({ username: followerUsername });
    const followed = await User.findOne({ username: followedUsername });

    if (!follower || !followed) {
      return res.status(404).json({ message: "Uno o ambos usuarios no existen." });
    }

    const existingFollow = await Follow.findOne({ followerUsername, followedUsername });
    if (existingFollow) {
      return res.status(400).json({ message: "Ya sigues a este usuario." });
    }

    const follow = new Follow({ 
      followerUsername,
      followedUsername,
    });
    await follow.save();

    // Crear y emitir notificación de seguimiento
    await createAndEmitNotification({
      recipient: followed._id,
      sender: follower._id,
      type: "follow",
      referenceId: follow._id,
      recipientUsername: followed.username,
    }, req.io);

    // Actualizar listas de seguidores y seguidos
    follower.following.push(followed._id);
    followed.followers.push(follower._id);
    await follower.save();
    await followed.save();

    return res.status(200).json({ message: "Usuario seguido con éxito." });
  } catch (error) {
    console.error("Error al seguir usuario:", error);
    return res.status(500).json({ message: "Error al seguir al usuario.", error: error.message });
  }
};


// Dejar de seguir a un usuario
export const unfollowUser = async (req, res) => {
  const { followerUsername, followedUsername } = req.body;

  if (!followerUsername || !followedUsername) {
    return res.status(400).json({ message: "Faltan parámetros requeridos." });
  }

  try {
    const follow = await Follow.findOneAndDelete({ followerUsername, followedUsername });
    if (!follow) {
      return res.status(400).json({ message: "No estás siguiendo a este usuario." });
    }

    const follower = await User.findOne({ username: followerUsername });
    const followed = await User.findOne({ username: followedUsername });

    // Eliminar referencias de seguidores y seguidos
    follower.following = follower.following.filter(id => id.toString() !== followed._id.toString());
    followed.followers = followed.followers.filter(id => id.toString() !== follower._id.toString());

    await follower.save();
    await followed.save();

    return res.status(200).json({ message: "Usuario dejado de seguir con éxito." });
  } catch (error) {
    console.error("Error al dejar de seguir usuario:", error);
    return res.status(500).json({ message: "Error al dejar de seguir al usuario.", error: error.message });
  }
};

// Verificar el estado de seguimiento
export const getFollowStatus = async (req, res) => {
  const { follower, followed } = req.params;

  if (!follower || !followed) {
    return res.status(400).json({ message: "Faltan parámetros requeridos." });
  }

  try {
    // Buscar si existe la relación de seguimiento
    const followRecord = await Follow.findOne({ followerUsername: follower, followedUsername: followed });
    return res.status(200).json({ isFollowing: !!followRecord }); // true si existe el registro, false si no
  } catch (error) {
    console.error("Error al verificar estado de seguimiento:", error);
    return res.status(500).json({ message: "Error al verificar estado de seguimiento.", error: error.message });
  }
};




