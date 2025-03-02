// chat.controller.js
import { Chat } from "./chat.model.js";
import { User } from "../models/user.model.js";
import { io } from "../app.js"; // Se asume que 'io' se exporta desde tu app principal

// Obtener todas las conversaciones del usuario logueado
export const getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "username photo")
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    console.error("Error al obtener chats:", error);
    res.status(500).json({ error: "Error interno al obtener chats" });
  }
};

// Obtener una conversación por ID (solo si el usuario es participante)
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId)
      .populate("participants", "username photo")
      .populate("messages.sender", "username photo");
    if (!chat || !chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }
    res.json(chat);
  } catch (error) {
    console.error("Error al obtener chat:", error);
    res.status(500).json({ error: "Error interno al obtener chat" });
  }
};

// Enviar un mensaje a una conversación
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    // Crear el nuevo mensaje
    const newMessage = { sender: req.user.id, content };
    chat.messages.push(newMessage);
    await chat.save();

    // Obtener el chat actualizado con los mensajes poblados
    const updatedChat = await Chat.findById(chatId).populate(
      "messages.sender",
      "username photo"
    );

    // El último mensaje insertado (populado)
    const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];

    // Emitir el mensaje a la sala del chat para los participantes activos
    io.to(chatId).emit("receiveMessage", {
      chatId,
      ...lastMessage.toObject(),
    });

    // Emitir un evento "newMessage" al receptor (si el remitente no es el receptor)
    const recipientId = chat.participants.find(
      (p) => p.toString() !== req.user.id
    );
    if (recipientId) {
      const recipient = await User.findById(recipientId);
      if (recipient) {
        // Se asume que el receptor se une a una sala con su username
        io.to(recipient.username).emit("newMessage", {
          chatId,
          ...lastMessage.toObject(),
        });
      }
    }

    // Responder con el array de mensajes actualizado
    res.json(updatedChat.messages);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error interno al enviar mensaje" });
  }
};

// Crear o recuperar un chat entre el usuario autenticado y el destinatario
export const createChat = async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ error: "No se proporcionó recipientId" });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({ error: "No puedes iniciar un chat contigo mismo" });
    }

    // Buscar si ya existe un chat entre ambos participantes
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, recipientId] },
    });

    if (!chat) {
      chat = new Chat({
        participants: [req.user.id, recipientId],
        messages: [],
      });
      await chat.save();
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error("Error al crear chat:", error);
    res.status(500).json({ error: "Error interno al crear chat" });
  }
};
