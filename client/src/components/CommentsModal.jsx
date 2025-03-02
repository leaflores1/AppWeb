import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

export default function CommentsModal({ album, photo, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const navigate = useNavigate();

  // Determinar el ID a usar: si se pasó album, usar album._id; si no, usar photo._id
  const id = album ? album._id : photo ? photo._id : null;

  useEffect(() => {
    if (!id) return;
    fetchComments(id);
  }, [id]);

  const fetchComments = async (id) => {
    try {
      const endpoint = album ? `/api/albums/${id}/comments` : `/api/comment/${id}/comments`;
      const res = await axios.get(endpoint);
      setComments(res.data);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const endpoint = album ? `/api/albums/${id}/comments` : `/api/comment/${id}/comments`;
      const res = await axios.post(endpoint, { text: newComment });
      setComments(res.data);
      setNewComment("");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  // Manejar envío al presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Evita que el Enter agregue un salto de línea
      handleAddComment();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="text-black absolute top-2 right-2">
          ✕
        </button>
        <h2 className="text-black text-xl font-bold mb-2">Comentarios</h2>
        <div className="max-h-64 overflow-y-auto mb-2">
          {comments.map((c) => (
            <div key={c._id} className="flex items-start gap-2 mb-2">
              <img
                src={c.user?.photo || "/foto.jpeg"}
                alt={c.user?.username}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                {/* Redirigir al perfil del usuario al hacer clic en su nombre */}
                <p
                  className="text-black text-sm font-semibold cursor-pointer hover:underline"
                  onClick={() => navigate(`/${c.user?.username}/gallery`)}
                >
                  {c.user?.username || "Desconocido"}
                </p>
                <p className="text-black text-sm">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center border-t pt-2">
          <input
            type="text"
            className="flex-grow border p-2 text-black"
            placeholder="Agregar un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyPress} // Detectar Enter
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-500 text-white px-4 py-2 ml-2 rounded"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
