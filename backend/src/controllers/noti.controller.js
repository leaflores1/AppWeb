import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import {Photo} from "../models/photo.model.js"

export const getNotifications = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const notifications = await Notification.find({ recipient: user._id })
  .populate("sender", "username photo") // Recupera estos campos
  .sort({ createdAt: -1 });

//console.log(notifications);


    res.status(200).json(
        
      notifications.map((notif) => ({
        ...notif.toObject(),
        senderUsername: notif.sender?.username,
        senderPhoto: notif.sender?.photo || "/default-profile.png",
      }))
    );
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const markAsRead = async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "Notificaciones marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar notificaciones como leídas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};


export const createAndEmitNotification = async (data, io) => {
  const notification = new Notification({
    recipient: data.recipient,
    sender: data.sender,
    type: data.type,
    referenceId: data.referenceId,
    mediaType: data.mediaType,
  });
  await notification.save();

  await notification.populate("sender", "username photo");

  // Si el tipo es like o comment, buscar la foto para obtener su URL
  let photoUrl = "";
  if (["like", "comment"].includes(data.type)) {
    const photo = await Photo.findById(data.referenceId);
    if (photo) {
      photoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${photo.fileName}`;
    }
  }

  if (io && data.recipientUsername) {
    io.to(data.recipientUsername).emit("notification", {
      ...notification.toObject(),
      senderUsername: notification.sender.username,
      senderPhoto: notification.sender.photo || "/default-profile.png",
      photoUrl, // se envía la URL de la foto para like y comment
    });
  }

  return notification;
};


