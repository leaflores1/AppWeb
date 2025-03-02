import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "../api/axios";
import { useAuth } from "../context/AuthContext";
import CommentsModal from "../components/CommentsModal";
import { handleReport } from "../services/reportService";
import { API_URL } from "../config";

export default function PhotoPage() {
  const { photoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Presigned URL si la foto es paga y está desbloqueada
  const [presignedUrl, setPresignedUrl] = useState(null);

  useEffect(() => {
    fetchPhoto();
    fetchComments();
  }, [photoId]);

  // Si la foto es paga y desbloqueada => pedimos Presigned
  useEffect(() => {
    if (photo) {
      const isOwner = photo.userId?._id?.toString() === user?.id.toString();
      const isUnlocked =
        isOwner ||
        photo.price === 0 ||
        (photo.unlockedBy &&
          photo.unlockedBy.some((id) => id.toString() === user?.id));

      if (photo.isPaidContent && isUnlocked && !presignedUrl) {
        fetchPaidPhotoUrl(photo._id);
      }
    }
  }, [photo, user, presignedUrl]);

  async function fetchPaidPhotoUrl(id) {
    try {
      const res = await axios.get(`${API_URL}/api/photos/${id}/url`, {
        withCredentials: true,
      });
      setPresignedUrl(res.data.url);
    } catch (err) {
      console.error("Error al obtener presigned URL:", err);
    }
  }

  const fetchPhoto = async () => {
    try {
      const response = await axios.get(`/api/photos/${photoId}`);
      setPhoto(response.data);
    } catch (error) {
      console.error("Error al cargar la foto:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comment/${photoId}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const response = await axios.post(`/api/comment/${photoId}/comments`, {
        text: newComment,
      });
      setComments(response.data);
      setNewComment("");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await axios.delete(`/api/photos/delete/${photoId}`, {
        withCredentials: true,
      });
      alert("Foto eliminada correctamente.");
      navigate("/");
    } catch (error) {
      console.error("Error al eliminar la foto:", error);
    }
  };

  const handleSubmitReport = () => {
    if (!selectedReason) {
      alert("Selecciona una razón para reportar.");
      return;
    }
    handleReport(photo._id, "photo", selectedReason, () => {
      alert("Reporte enviado correctamente.");
      setIsOptionsModalOpen(false);
      setIsReportModalOpen(false);
    });
  };

  const openPhotoModal = async (photo) => {
    //console.log("Botón 'Desbloquear Post' presionado. Datos de photo:", photo);
    if (!photo || !photo.price || !user.id) {
      console.error("Datos incompletos para crear la orden:", { photo, user });
      return;
    }
    try {
      const token = localStorage.getItem("token");
      //console.log("Token obtenido del localStorage:", token);

      const price = parseFloat(photo.price);
      const fee = price * 0.01;

      const response = await axios.post(
        `${API_URL}/api/payment/create-order`,
        {
          photoId: photo._id,
          title: "Desbloqueo Foto",
          unit_price: photo.price,
          quantity: 1,
          marketplace_fee: fee,
          amount: photo.price,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //console.log( "Orden creada exitosamente. Respuesta del backend:", response.data);
      const { init_point } = response.data;
      window.location.href = init_point;
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    }
  };

  if (!photo) {
    return <p className="text-center text-white">Cargando publicación...</p>;
  }

  const isOwner = photo.userId?._id === user.id;
  const isPurchaser = photo.unlockedBy?.some((uid) => uid === user.id);
  const isPaid = photo.isPaidContent;
  const isPhotoUnlocked = isOwner || isPurchaser || !isPaid;

  let finalSrc;
  if (isPaid && isPhotoUnlocked) {
    finalSrc = presignedUrl || photo.s3Url;
  } else if (isPaid) {
    finalSrc =
      photo.mediaType === "video"
        ? "/videos-miniatura.jpg"
        : photo.blurUrl || "/fallback_blur.jpg";
  } else {
    finalSrc = photo.s3Url;
  }

 // Manejar envío al presionar Enter
 const handleKeyPress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Evita que el Enter agregue un salto de línea
    handleAddComment();
  }
};

  return (
    <>
      <div className="photo-page flex justify-center items-center min-h-screen bg-black">
        <div className="bg-black shadow-lg rounded-lg flex flex-col md:flex-row max-w-[90%] w-full max-h-[95vh] overflow-hidden">
          {/* Foto/Video */}
          <div className="w-full md:w-1/2 flex items-center justify-center relative">
          
            {photo.mediaType === "video" ? (
              isPhotoUnlocked ? (
                <video
                  src={finalSrc}
                  controls
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : (
                <img
                  src="/videos-miniatura.jpg"
                  alt="Video bloqueado"
                  className="w-full max-h-[80vh] object-contain"
                />
              )
            ) : (
              <img
                src={finalSrc}
                alt={photo.fileName}
                className="w-full max-h-[80vh] object-contain"
              />
            )}

            {/* Overlay si NO está desbloqueado y es de pago y es una imagen */}
            {!isPhotoUnlocked &&
                  photo.price > 0 &&
                  photo.mediaType !== "video" && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                      onClick={() => openPhotoModal(photo)}
                    >
                      <img
                        src="/imagenblock.png" // Asegúrate de que el ícono esté en la ruta correcta
                        alt="Imagen bloqueada"
                        className="h-24 w-24 object-contain"
                      />
                    </div>
                  )}


          </div>

          {/* Información/Comentarios */}
          <div className="w-full md:w-1/2 flex flex-col p-4 overflow-auto">
          {/* Información del usuario */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src={photo.userId?.photo || "/foto.jpeg"}
                alt={photo.userId?.username || "Usuario"}
                className="w-10 h-10 rounded-full object-cover"
                onClick={() => navigate(`/${photo.userId?.username}/gallery`)}
              />
              <p className="text-white font-semibold text-lg"
                  onClick={() => navigate(`/${photo.userId?.username}/gallery`)}>
                {photo.userId?.username || "Usuario Desconocido"}
              </p>

              {/* Opciones */}
              <button
                className="text-white ml-auto text-2xl"
                onClick={() => setIsOptionsModalOpen(true)}
              >
                ⋮
              </button>
            </div>

            <p className="text-white text-sm">
              Este post tiene un precio de <strong>${photo.price} {photo.currency}</strong>
            </p>
            {!isPhotoUnlocked && photo.price > 0 && (
              <div className="mb-4">
                <button
                  className="bg-blue-600 text-white px-3 py-1 mt-2 rounded text-sm"
                  onClick={() => openPhotoModal(photo)}
                >
                  Desbloquear Post
                </button>
              </div>
            )}

            {/* Botones de interacción */}
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/corazon.png"
                alt="Like"
                className="w-6 h-6 object-contain cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await axios.put(`/api/photos/${photoId}/like`);
                    setPhoto((prev) => ({ ...prev, likes: res.data.likes }));
                  } catch (error) {
                    console.error("Error al dar like:", error);
                  }
                }}
              />
              <p className="text-white">{photo.likes?.length || 0} Me gusta</p>
            </div>

            {/* Descripción */}
            <div className="flex items-center gap-2 px-4 -ml-4">
              <span className="font-semibold text-white">
                {photo.userId?.username}
              </span>
              {photo.description && (
                <p className="text-white text-sm">{photo.description}</p>
              )}
            </div>
            <div className="border-t border-gray-600 my-3"></div>
            <h2 className="text-white font-medium mb-2">Comentarios</h2>

            <div
              className={`${
                comments.length > 4 ? "max-h-48 overflow-y-scroll" : ""
              } flex-1 text-white`}
            >
              {comments.map((comment) => (
                <div key={comment._id} className="flex items-start gap-2 mb-2">
                  <img
                    src={comment.user?.photo || "/foto.jpeg"}
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full object-cover"
                    onClick={() => navigate(`/${photo.userId?.username}/gallery`)}
                  />
                  <div>
                    <p className="font-semibold">
                      {comment.user?.username || "Anónimo"}
                    </p>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input para comentarios */}
            <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden border border-gray-600 mt-4">
              <input
                type="text"
                placeholder="Agregar un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-grow p-2 text-white bg-transparent border-none outline-none placeholder-gray-400"
                onKeyDown={handleKeyPress}
              />
              <button
                onClick={handleAddComment}
                className="bg-blue-500 text-white px-4 py-2"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {isCommentModalOpen && (
        <CommentsModal
          photo={photo}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}

      {/* Opciones */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-sm w-full">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setIsOptionsModalOpen(false)}
            >
              ✕
            </button>
            <p className="mb-4 text-black">Opciones</p>
            <button
              className="block w-full text-left bg-gray-200 px-4 py-2 rounded mb-2"
              onClick={() => setIsReportModalOpen(true)}
            >
              Reportar
            </button>
            {isOwner && (
              <button
                className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleDeletePhoto}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reportar */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-sm w-full">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setIsReportModalOpen(false)}
            >
              ✕
            </button>
            <p className="mb-4 text-black">
              Selecciona una razón para el reporte:
            </p>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full p-2 border rounded mb-4 text-black"
            >
              <option value="">Seleccionar razón</option>
              <option value="Contenido inapropiado">
                Contenido inapropiado
              </option>
              <option value="Spam">Spam</option>
              <option value="Abuso">Abuso</option>
            </select>
            <button
              className="block w-full bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleSubmitReport}
            >
              Enviar reporte
            </button>
          </div>
        </div>
      )}
    </>
  );
}
