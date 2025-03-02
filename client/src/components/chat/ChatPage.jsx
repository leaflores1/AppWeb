import { useParams } from "react-router-dom";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { useAuth } from "../../context/AuthContext";

export default function ChatPage() {
  const { chatId } = useParams();
  const { user } = useAuth();

  return (
    <div className="h-screen flex flex-col lg:flex-row bg-black text-white">
      {/* Lista de chats: ocupa toda la pantalla en móviles si no hay chat seleccionado */}
      <div
        className={`lg:w-1/3 lg:border-r border-gray-700 flex-shrink-0 ${
          chatId ? "hidden lg:block" : "block w-full"
        }`}
      >
        <ChatList user={user} />
      </div>

      {/* Ventana de chat: ocupa toda la pantalla en móviles si se selecciona un chat */}
      <div
        className={`lg:w-2/3 flex-grow ${
          chatId ? "block" : "hidden lg:block"
        }`}
      >
        {chatId ? (
          <ChatWindow chatId={chatId} user={user} />
        ) : (
          <p className="text-center text-gray-400 p-4 mt-8">
            Selecciona una conversación para comenzar a chatear.
          </p>
        )}
      </div>
    </div>
  );
}
