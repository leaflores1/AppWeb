import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { API_URL } from "../config";
import { handleReport } from "../services/reportService";
import CommentsModal from "../components/CommentsModal";
import { deleteAlbum } from "../services/albumService";

// IMPORTANTE: Asegúrate de que tus modelos (Photo) incluyan isPaidContent
// y el endpoint /api/photos/:photoId/url está implementado (similar a las fotos individuales).

export default function AlbumModal({
  album: initialAlbum,
  user,
  onClose,
  onDeleteAlbum,
  onAlbumUpdated, // Callback para actualizar el álbum en el estado global
}) {
  // Estados del componente
  const navigate = useNavigate();
  const [album, setAlbum] = useState(initialAlbum);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");

  // Mapa de presigned URLs para fotos de pago: { photoId: presignedURL }
  const [presignedMap, setPresignedMap] = useState({});
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Fotos del álbum
  const photos = album?.photos || [];

  useEffect(() => {
    if (album?._id) fetchAlbumComments(album._id);
  }, [album?._id]);

  // Verificación de acceso
  const isOwner = album.userId?._id?.toString() === user?.id?.toString();
  const isAlbumUnlocked =
    isOwner || album.price === 0 || album.unlockedBy?.includes(user?.id);

  // Cargar Presigned URLs solo si el álbum está desbloqueado
  useEffect(() => {
    if (isAlbumUnlocked && photos.length > 0) {
      photos.forEach((photo) => {
        if (photo.isPaidContent && !presignedMap[photo._id]) {
          fetchPaidPhotoUrl(photo._id);
        }
      });
    }
  }, [isAlbumUnlocked, photos]);

  // Pedir un Presigned URL para una foto paga
  async function fetchPaidPhotoUrl(id) {
    try {
      const res = await axios.get(`${API_URL}/api/photos/${id}/url`, {
        withCredentials: true,
      });
      setPresignedMap((prev) => ({ ...prev, [id]: res.data.url }));
    } catch (err) {
      console.error("Error al obtener presigned URL:", err);
    }
  }

  // Función para obtener comentarios
  const fetchAlbumComments = async (albumId) => {
    try {
      const res = await axios.get(`/api/albums/${albumId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error("Error al cargar comentarios del álbum:", error);
    }
  };

  // Agregar comentario
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/albums/${album._id}/comments`, {
        text: newComment,
      });
      setComments(res.data);
      setNewComment("");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  // Manejar like
  const handleLike = async () => {
    try {
      const res = await axios.put(`/api/albums/${album._id}/like`);
      // res.data => array de likes
      setAlbum({ ...album, likes: res.data });
    } catch (error) {
      console.error("Error al dar like al álbum:", error);
    }
  };

  // Manejar envío al presionar Enter
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Evita que el Enter agregue un salto de línea
      handleAddComment();
    }
  };

  // Desbloquear el álbum
  const handleUnlockAlbum = async () => {
    if (!album || !album._id || !user?.id) {
      console.error("Datos incompletos para desbloquear el álbum:", {
        album,
        user,
      });
      return;
    }

    setLoadingPayment(true);

    try {
      const token = localStorage.getItem("token");
      const price = parseFloat(album.price);
      const fee = price * 0.01; // Ajusta la comisión

      const response = await axios.post(
        `https://localhost:3000.com/api/payment/create-order`,
        {
          albumId: album._id, // Enviar albumId en lugar de photoId
          title: `Desbloqueo Álbum: ${album.title}`,
          unit_price: album.price,
          quantity: 1,
          marketplace_fee: fee,
          amount: album.price,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { init_point } = response.data;
      window.location.href = init_point; // Redirige a MercadoPago
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    } finally {
      setLoadingPayment(false);
    }
  };

  // Presigned logic: si la foto es paga y isAlbumUnlocked, usamos presigned URL
  const getPhotoSrc = (photo) => {
    if (!photo) return "/albums-miniatura.jpg";

    if (!isAlbumUnlocked) {
      return "/albums-miniatura.jpg"; // Si el álbum está bloqueado, muestra miniatura genérica
    }

    if (photo.isPaidContent) {
      return presignedMap[photo._id] || photo.s3Url; // Usa la presigned URL si está desbloqueado
    }

    return photo.s3Url;
  };

  // NAV: Fotos anteriores / siguientes
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  // Manejo de reporte
  const handleSubmitReport = () => {
    if (!selectedReason) {
      alert("Selecciona una razón para reportar.");
      return;
    }

    handleReport(album._id, "album", selectedReason, () => {
      alert("Reporte enviado correctamente.");
      setIsReportModalOpen(false);
      setIsOptionsModalOpen(false);
    });
  };

  // Eliminar el álbum
  const handleDeleteAlbum = async () => {
    try {
      await deleteAlbum(album._id);
      setAlbum(null);

      if (onDeleteAlbum) {
        onDeleteAlbum(album._id); // callback para removerlo de la lista global
      }

      onClose(); // Cierra el modal
    } catch (error) {
      console.error("Error al eliminar el álbum:", error);
    }
  };

  if (!album) return null;

  return (
    <>
      {/* Modal principal del álbum */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[0]"
        onClick={onClose}
      >
        <div
          className="bg-black shadow-lg rounded-lg max-w-[90%] w-full max-h-[95vh] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de opciones (tres puntos) */}
          <button
            className="text-white absolute top-4 right-4 text-2xl"
            onClick={() => setIsOptionsModalOpen(true)}
          >
            ⋮
          </button>

          {/* Contenido principal */}
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 flex items-center justify-center relative">
              {!isAlbumUnlocked ? (
                <img
                  src="/albums-miniatura.jpg"
                  alt="Album bloqueado"
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : photos[currentIndex]?.mediaType === "video" ? (
                <video
                  src={getPhotoSrc(photos[currentIndex])}
                  controls={isAlbumUnlocked}
                  className={`w-full max-h-[60vh] object-contain`}
                />
              ) : (
                <img
                  src={getPhotoSrc(photos[currentIndex])}
                  alt="Foto actual"
                  className={`w-full max-h-[80vh] object-contain`}
                />
              )}

              {/* Flechas de navegación */}
              {isAlbumUnlocked && photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-700 bg-opacity-50 text-white px-3 py-2 rounded-full z-10"
                  >
                    ←
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-700 bg-opacity-50 text-white px-3 py-2 rounded-full z-10"
                  >
                    →
                  </button>
                </>
              )}
            </div>

            {/* Sección de información */}
            <div className="w-full md:w-1/2 flex flex-col p-4 overflow-auto">
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={album.userId?.photo || "/foto.jpeg"}
                    alt={album.userId?.username || "Usuario"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="text-white font-semibold text-lg">
                    {album.userId?.username || "Usuario Desconocido"}
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-white text-sm">
                    Este álbum tiene un precio de{" "}
                    <strong>${album.price} {album.currency}</strong>
                  </p>
                  {!isAlbumUnlocked && album.price > 0 && (
                    <button
                      className="bg-blue-600 text-white px-3 py-1 mt-2 rounded text-sm"
                      onClick={handleUnlockAlbum}
                      disabled={loadingPayment}
                    >
                      {loadingPayment ? "Procesando..." : "Desbloquear Álbum"}
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <img
                    src="/corazon.png"
                    alt="Like"
                    className="w-6 h-6 object-contain cursor-pointer"
                    onClick={handleLike}
                  />
                  <p className="text-white text-base">
                    {album.likes?.length || 0} Me gusta
                  </p>
                </div>
                <div className="flex flex-col gap-2 px-4 -ml-4">
                  <span className="font-semibold text-white text-base">
                    {album.userId?.username}
                  </span>
                  {album.description && (
                    <p className="text-white text-sm">{album.description}</p>
                  )}
                </div>
                {/* Línea separadora */}
                <div className="border-t border-gray-600 my-3"></div>
                {/* Comentarios inline en desktop */}
                <h2 className="text-white font-bold mb-2 text-base">
                  Comentarios
                </h2>

                <div
                  className={`${
                    comments.length > 4 ? "max-h-48 overflow-y-scroll" : ""
                  } flex-1 text-white text-base mb-4`}
                >
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="flex items-start gap-2 mb-2"
                    >
                      <img
                        src={comment.user?.photo || "/foto.jpeg"}
                        alt={comment.user?.username || "Usuario"}
                        className="w-8 h-8 rounded-full object-cover"
                        onClick={() => {
                          navigate(`/${comment.user?.username}/gallery`);
                          onClose();
                        }}
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
                {/* Input para agregar comentario */}
                <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden border border-gray-600">
                  <input
                    type="text"
                    placeholder="Agregar un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-grow p-2 text-white text-sm bg-transparent border-none outline-none placeholder-gray-400"
                    onKeyDown={handleKeyPress}
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-600 text-white text-sm px-4 py-2"
                  >
                    Publicar
                  </button>
                </div>
              </div>

              {/* Versión mobile */}
              <div className="block md:hidden">
                <div className="w-full bg-black text-center text-white -mt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{album.userId?.username}</span>
                    <span className="text-sm">{album.description}</span>
                  </div>

                  <button
                    className="text-white absolute top-4 right-4 text-2xl z-50"
                    onClick={() => setIsOptionsModalOpen(true)}
                  >
                    ⋮
                  </button>

                  <div className="mt-1 flex items-center space-x-4">
                    <button
                      onClick={handleLike}
                      className="flex items-center text-white text-sm"
                    >
                      <img
                        src="/corazon.png"
                        alt="Like"
                        className="w-5 h-5 mr-1"
                      />
                      {album.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => setIsCommentModalOpen(true)}
                      className="flex items-center text-white text-sm"
                    >
                      <img
                        src="/comment.png"
                        alt="Comentarios"
                        className="w-5 h-5 mr-1"
                      />
                      {comments.length}
                    </button>
                  </div>
                  <p className="text-white text-sm mt-3">
                    Este Album tiene un precio de <strong>${album.price} {album.currency}</strong>
                  </p>
                  {!isAlbumUnlocked && album.price > 0 && (
                    <div className="mb-1">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 mt-2 rounded text-sm"
                        onClick={handleUnlockAlbum}
                      >
                        Desbloquear Álbum
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para comentarios en mobile */}
      {isCommentModalOpen && (
        <CommentsModal
          album={album}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}

      {/* Modal de Opciones */}
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
              className="text-black block w-full text-left bg-gray-200 px-4 py-2 rounded mb-2"
              onClick={() => setIsReportModalOpen(true)}
            >
              Reportar
            </button>

            {isOwner && (
              <button
                className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleDeleteAlbum}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para Reportar */}
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
