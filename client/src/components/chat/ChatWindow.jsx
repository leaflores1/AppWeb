import { useState, useEffect, useRef } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";
import socket from "../../socket";

export default function ChatWindow({ chatId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Cargar el chat y unirse a la sala
  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await axios.get(`/api/chats/${chatId}`, {
          withCredentials: true,
        });
        setMessages(res.data.messages);
        socket.emit("joinChat", chatId);
      } catch (error) {
        console.error("Error al obtener chat:", error);
      }
    };
    if (chatId) fetchChat();
  }, [chatId]);

  // Auto-scroll al final cada vez que cambian los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (data) => {
      if (data.chatId === chatId) {
        setMessages((prev) => [...prev, data]);
      }
    };
    socket.on("receiveMessage", handler);
    return () => socket.off("receiveMessage", handler);
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await axios.post(
        `/api/chats/${chatId}/messages`,
        { content: newMessage },
        { withCredentials: true }
      );
      setMessages(res.data);
      setNewMessage("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setTimeout(() => setIsSending(false), 300);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.repeat && !isSending) {
      sendMessage();
    }
  };

  
  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Encabezado fijo */}
      <div className="flex items-center p-2 bg-black sticky top-0 z-20 border-b border-gray-700 shadow-lg pt-14">
        <Link to="/inbox" className="text-blue-500 font-bold text-lg mr-4">&larr; Atrás</Link>
        <h2 className="text-xl font-bold flex-1">Chat</h2>
      </div>
      {/* Contenedor de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isCurrentUser = msg.sender?._id === user.id;
          return (
            <div key={msg._id} className={`flex ${isCurrentUser ? "justify-end" : ""}`}>
              {!isCurrentUser && (
                <img src={msg.sender.photo || "/foto.jpeg"} alt="Foto" className="w-8 h-8 rounded-full mr-2" />
              )}
              <div className={`px-4 py-2 rounded-lg max-w-xs ${isCurrentUser ? "bg-blue-500 text-white" : "bg-gray-800 text-white"}`}>
                {!isCurrentUser && <p className="font-semibold">{msg.sender?.username}</p>}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {/* Input fijo */}
      <div className="flex items-center p-3 bg-black sticky bottom-0 z-20 border-t border-gray-700 shadow-lg">
        <input
          type="text"
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 py-2 px-3 bg-gray-800 text-white rounded-l-lg"
        />
        <button onClick={sendMessage} className="bg-blue-500 px-4 py-2 rounded-r-lg text-white">
          Enviar
        </button>
      </div>
    </div>
  );
}
