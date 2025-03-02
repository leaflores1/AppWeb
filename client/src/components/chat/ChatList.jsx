import { useState, useEffect } from "react";
import axios from "../../api/axios";
import { Link } from "react-router-dom";
import { API_URL } from "../../config";

export default function ChatList({ user }) {
  const [chats, setChats] = useState([]);
  // Estado para almacenar el mapeo de chatId a cantidad de mensajes nuevos
  const [unreadMap, setUnreadMap] = useState({});

  // Obtener la lista de chats del usuario
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/chats`, {
          withCredentials: true,
        });
        setChats(res.data);
      } catch (error) {
        console.error("Error al obtener chats:", error);
      }
    };
    if (user?.id) fetchChats();
  }, [user]);

  // Cargar el objeto de mensajes no leídos desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("unreadMessagesByChat");
    if (stored) {
      setUnreadMap(JSON.parse(stored));
    } else {
      setUnreadMap({});
    }
  }, [chats]);

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-black p-4 space-y-4 mt-6">
      <h2 className="text-xl font-bold mb-4">Mensajes</h2>
      {chats.length === 0 ? (
        <p className="text-gray-400">No tienes conversaciones.</p>
      ) : (
        chats.map((chat) => {
          // Filtrar para obtener al otro participante
          const otherParticipants = chat.participants.filter(
            (p) => p._id !== user.id
          );
          const otherUser = otherParticipants[0];
          // Leer el contador para este chat (si existe)
          const chatUnread = unreadMap[chat._id] || 0;

          return (
            <Link
              key={chat._id}
              to={`/inbox/${chat._id}`}
              onClick={() => {
                // Obtener el objeto de mensajes no leídos del localStorage
                const stored = localStorage.getItem("unreadMessagesByChat");
                let parsed = stored ? JSON.parse(stored) : {};
                // Resetear el contador para este chat
                parsed[chat._id] = 0;
                localStorage.setItem(
                  "unreadMessagesByChat",
                  JSON.stringify(parsed)
                );
                // Actualizar el estado local para que este componente se re-renderice
                setUnreadMap(parsed);
                // Disparar un evento personalizado para que otros componentes (por ejemplo, Navbar) actualicen su estado
                window.dispatchEvent(new Event("unreadMessagesUpdated"));
              }}
              className="relative flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              {otherUser && (
                <img
                  src={otherUser.photo || "/foto.jpeg"}
                  alt="Foto"
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {otherUser?.username || "Usuario"}
                </p>
                <p className="text-sm text-gray-400 truncate">
                  Último mensaje...
                </p>
              </div>
              {chatUnread > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center z-50">
                  {chatUnread}
                </span>
              )}
            </Link>
          );
        })
      )}
    </div>
  );
}
