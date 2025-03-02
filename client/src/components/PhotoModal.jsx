import { useEffect, useState } from "react";
import {useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "../api/axios";
import CommentsModal from "../components/CommentsModal";
import { handleReport } from "../services/reportService";
import { API_URL } from "../config"; // Asegúrate de importar tu URL base

export default function PhotoModal({ photo: initialPhoto, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(initialPhoto);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [presignedUrl, setPresignedUrl] = useState(null);
  const [loadingUrl, setLoadingUrl] = useState(false); // Indicador de carga de la imagen

  useEffect(() => {
    if (!initialPhoto._id) return; // Evitar llamadas innecesarias si no hay photoId
    fetchDetailedPhoto(initialPhoto._id);
    fetchComments(initialPhoto._id);
  }, [initialPhoto._id]);

  const fetchDetailedPhoto = async (photoId) => {
    try {
      const res = await axios.get(`${API_URL}/api/photos/${photoId}`, {
        withCredentials: true,
      });
      setPhoto(res.data);
    } catch (error) {
      console.error("Error al obtener detalle de la foto:", error);
    }
  };

  // Obtener presigned URL solo si es necesario
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
      //console.log(`📡 Solicitando presigned URL para foto: ${id}`);
      const res = await axios.get(`${API_URL}/api/photos/${id}/url`, {
        withCredentials: true,
      });

      //console.log(`✅ Presigned URL recibida:`, res.data.url);
      setPresignedUrl(res.data.url);
    } catch (err) {
      console.error("❌ Error al obtener presigned URL:", err);
    }
  }

  // Obtiene comentarios
  const fetchComments = async (photoId) => {
    try {
      const res = await axios.get(`/api/comment/${photoId}/comments`);
      setComments(res.data);
    } catch (error) {
      console.error("Error al cargar comentarios:", error);
    }
  };

  // Agregar comentario
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await axios.post(`/api/comment/${photo._id}/comments`, {
        text: newComment,
      });
      setComments(res.data);
      setNewComment("");
    } catch (error) {
      console.error("Error al agregar comentario:", error);
    }
  };

  // Like
  const handleLike = async () => {
    try {
      const res = await axios.put(`/api/photos/${photo._id}/like`);
      setPhoto((prev) => ({ ...prev, likes: res.data.likes }));
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  };

  // Eliminar foto (solo dueño)
  const handleDeletePhoto = async () => {
    try {
      await axios.delete(`/api/photos/delete/${photo._id}`);
      onClose(); // Cerrar el modal tras eliminar la foto
    } catch (error) {
      console.error("Error al eliminar la foto:", error);
    }
  };

  // Reportar foto
  const handleSubmitReport = () => {
    if (!selectedReason) {
      alert("Selecciona una razón para reportar.");
      return;
    }

    handleReport(photo._id, "photo", selectedReason, () => {
      alert("Reporte enviado correctamente.");
      setIsReportModalOpen(false);
      setIsOptionsModalOpen(false);
    });
  };
  
 // Manejar envío al presionar Enter
 const handleKeyPress = (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // Evita que el Enter agregue un salto de línea
    handleAddComment();
  }
};

  // Abre el flujo de pago
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
        `https://localhost:3000.com/api/payment/create-order`,
        {
          photoId: photo._id,
          title: "Desbloqueo Foto",
          unit_price: photo.price,
          quantity: 1,
          marketplace_fee: fee, // Ajusta según la comisión
          amount: photo.price,
        },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //console.log("Orden creada exitosamente. Respuesta del backend:",response.data);
      const { init_point } = response.data;
      window.location.href = init_point; // Redirige al enlace de pago
    } catch (error) {
      console.error("Error al iniciar el pago:", error);
    }
  };

  const isOwner = photo.userId?._id === user.id;
  const isPurchaser = photo.unlockedBy?.some((uid) => uid === user.id);
  const isPaid = photo.isPaidContent;

  //console.log(`🔍 quien es comprador? `, isPurchaser);

  // Se define isPhotoUnlocked => true si esOwner o isPurchaser
  const isPhotoUnlocked = isOwner || isPurchaser || !isPaid;

  let finalSrc;

  if (isPaid && isPhotoUnlocked) {
    finalSrc = presignedUrl || photo.s3Url;
  } else if (isPaid) {
    if (photo.mediaType === "video") {
      finalSrc = "/videos-miniatura.jpg"; // Miniatura para videos bloqueados
    } else {
      finalSrc = photo.blurUrl || "/fallback_blur.jpg"; // Miniatura para imágenes bloqueadas
    }
  } else {
    finalSrc = photo.s3Url;
  }
  //console.log(`🔍 La presignedurl se genero?`, presignedUrl);
  //console.log(`🔍 La foto esta desbloqueada?`, isPhotoUnlocked);
  //console.log(`🔍 FinalSrc a usar en PhotoModal:`, finalSrc);

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[40] mt-8"
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
              {/* 
                - Si photo.mediaType === "video": usamos <video />
                - Usamos presignedUrl si existe, de lo contrario photo.s3Url
              */}
              {photo.mediaType === "video" ? (
                isPhotoUnlocked ? (
                  <video
                  src={presignedUrl || photo.s3Url}
                    controls
                    className="w-full max-h-[60vh] object-contain z-20"
                  />
                ) : (
                  <img
                    src="/videos-miniatura.jpg"
                    alt="Video bloqueado"
                    className="w-full max-h-[80vh] object-contain z-20"
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

            {/* Información / Comentarios */}
            <div className="w-full md:w-1/2 flex flex-col p-4 overflow-auto">
              {/* Desktop */}
              <div className="hidden md:block">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={photo.userId?.photo || "/foto.jpeg"}
                    alt={photo.userId?.username || "Usuario"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <p className="text-white font-semibold text-lg">
                    {photo.userId?.username || "Usuario Desconocido"}
                  </p>
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

                <div className="flex items-center gap-2 mb-4">
                  <img
                    src="/corazon.png"
                    alt="Like"
                    className="w-6 h-6 object-contain cursor-pointer"
                    onClick={handleLike}
                  />
                  <p className="text-white">
                    {photo.likes?.length || 0} Me gusta
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 -ml-4">
                  <span className="font-semibold text-white">
                    {photo.userId?.username}
                  </span>
                  {photo.description && (
                    <p className="text-white text-sm">{photo.description}</p>
                  )}
                </div>
                {/* Línea separadora */}
                <div className="border-t border-gray-600 my-3"></div>
                <h2 className="text-white font-medium mb-2">Comentarios</h2>

                {/* Comentarios con scroll */}
                <div
                  className={`${
                    comments.length > 4 ? "max-h-48 overflow-y-scroll" : ""
                  } flex-1 text-white`}
                >
                  {comments.map((comment) => (
                    <div
                      key={comment._id}
                      className="flex items-start gap-2 mb-2"
                    >
                      <img
                        src={comment.user?.photo || "/foto.jpeg"}
                        alt={comment.user?.username}
                        className="w-8 h-8 rounded-full object-cover"
                        onClick={() => {
                        navigate(`/${comment.user?.username}/gallery`)
                        onClose();
                      }}
                       
                      />
                      <div>
                        <p className="font-semibold"
                        onClick={() =>
                          navigate(`/${comment.user?.username}/gallery`)
                        }>
                          {comment.user?.username || "Anónimo"}
                        </p>
                        <p>{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input para agregar comentario */}
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
                    className="bg-blue-600 text-white px-4 py-2"
                  >
                    Publicar
                  </button>
                </div>
              </div>

              {/* Versión mobile */}
              <div className="block md:hidden">
                <div className="w-full bg-black text-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{photo.userId?.username}</span>
                    <span className="text-sm">{photo.description}</span>
                  </div>

                  <button
                    className="text-white absolute top-4 right-4 text-2xl z-50"
                    onClick={() => setIsOptionsModalOpen(true)}
                  >
                    ⋮
                  </button>

                  <div className="mt-2 flex items-center space-x-4">
                    <button
                      onClick={handleLike}
                      className="flex items-center text-white"
                    >
                      <img
                        src="/corazon.png"
                        alt="Like"
                        className="w-5 h-5 mr-1"
                      />
                      {photo.likes?.length || 0}
                    </button>
                    <button
                      onClick={() => setIsCommentModalOpen(true)}
                      className="flex items-center text-white"
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
                    Este post tiene un precio de <strong>${photo.price} {photo.currency}</strong>
                  </p>
                  {!isPhotoUnlocked && photo.price > 0 && (
                    <div className="mb-1">
                      <button
                        className="bg-blue-600 text-white px-3 py-1 mt-2 rounded text-sm"
                        onClick={() => openPhotoModal(photo)}
                      >
                        Desbloquear Post
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
          photo={photo}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}

      {/* Modal para opciones */}
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
                onClick={handleDeletePhoto}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para seleccionar razón del reporte */}
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
