import { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import CommentsModal from "../components/CommentsModal";
import { handleReport } from "../services/reportService";

export function Feed() {
  const { user } = useAuth();

  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [presignedMap, setPresignedMap] = useState({});

  // Estados para modales y opciones
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");

  const observer = useRef();

  // Función para abrir el modal de foto (ajústala según tus necesidades)
  const openPhotoModal = (feed) => {
    // Por ejemplo, se puede abrir un modal con la imagen en detalle
    //console.log("Abrir modal para:", feed);
  };

  // Carga de feeds con paginación
  useEffect(() => {
    const fetchFeeds = async () => {
      if (!hasMore) return;

      try {
        const response = await axios.get(
          `${API_URL}/api/feed?page=${page}&limit=10`,
          { withCredentials: true }
        );

        let feedsData = [];
        let hasMoreData = false;

        if (Array.isArray(response.data)) {
          feedsData = response.data;
          hasMoreData = response.data.length === 10;
        } else if (response.data && Array.isArray(response.data.feeds)) {
          feedsData = response.data.feeds;
          hasMoreData = response.data.hasMore ?? false;
        } else {
          console.error(
            "Error: La respuesta de la API no contiene un array válido.",
            response.data
          );
          return;
        }

        setFeeds((prev) => (page === 1 ? feedsData : [...prev, ...feedsData]));
        setHasMore(hasMoreData);
      } catch (error) {
        console.error("Error al obtener feeds:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, [page, hasMore]);

  // IntersectionObserver para detectar el último elemento visible y cargar más
  const lastFeedElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  async function fetchPaidPhotoUrl(photoId) {
    try {
      const res = await axios.get(`${API_URL}/api/photos/${photoId}/url`, {
        withCredentials: true,
      });
      setPresignedMap((prev) => ({ ...prev, [photoId]: res.data.url }));
    } catch (err) {
      console.error("Error al obtener presigned URL:", err);
    }
  }

  // Toggle Like
  const toggleLike = async (photoId) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/photos/${photoId}/like`,
        {},
        { withCredentials: true }
      );
      setFeeds((prev) =>
        prev.map((f) =>
          f._id === photoId ? { ...f, likes: response.data.likes } : f
        )
      );
    } catch (error) {
      console.error("Error al dar/unlike:", error);
    }
  };

  // Eliminar foto
  const handleDelete = async (photoId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/photos/delete/${photoId}`,
        { withCredentials: true }
      );
      if (response.status === 200) {
        setFeeds((prev) => prev.filter((feed) => feed._id !== photoId));
        setIsDeleteModalOpen(false);
        setIsOptionsModalOpen(false);
      }
    } catch (error) {
      console.error("Error al eliminar la foto:", error);
    }
  };

  // Reportar
  const handleSubmitReport = () => {
    if (!selectedReason) {
      alert("Selecciona una razón para reportar.");
      return;
    }

    if (!selectedItem || !selectedItem._id) {
      alert("No se ha seleccionado un ítem válido para reportar.");
      return;
    }

    handleReport(selectedItem._id, "photo", selectedReason, () => {
      alert("Reporte enviado correctamente.");
      setIsOptionsModalOpen(false);
      setIsReportModalOpen(false);
    });
  };

  // Menú de opciones
  const openOptionsModal = (feed) => {
    setSelectedItem(feed);
    setIsOptionsModalOpen(true);
  };
  const closeOptionsModal = () => {
    setSelectedItem(null);
    setIsOptionsModalOpen(false);
  };

  if (loading) {
    return <p className="text-center">Cargando feeds...</p>;
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-6 max-w-screen-xs mx-auto mt-16">
      {feeds.map((feed, index) => {
        // Determinar condiciones
        const isOwner = feed.userId._id === user.id;
        const isPurchaser = feed.unlockedBy?.some((uid) => uid === user.id);
        const isPaid = feed.isPaidContent;
        const isUnlocked = isPurchaser || !isPaid;

        // Si es contenido de pago y el usuario lo compró, se debe obtener la URL presignada (si aún no se tiene)
        if (isPaid && isPurchaser && !presignedMap[feed._id]) {
          fetchPaidPhotoUrl(feed._id);
        }

        // Calcular la URL final de la imagen/video
        let finalSrc = feed.s3Url;
        if (isPaid) {
          if (isOwner) {
            finalSrc =
              feed.mediaType === "video"
                ? "/videos-miniatura.jpg"
                : feed.blurUrl || "/fallback_blur.jpg";
          } else if (isPurchaser) {
            finalSrc = presignedMap[feed._id] || feed.s3Url;
          } else {
            finalSrc = feed.blurUrl || "/fallback_blur.jpg";
          }
        }

        // Ordenar las resoluciones para imágenes responsive
        const sortedResponsive = [...(feed.responsive || [])].sort(
          (a, b) => b.width - a.width
        );

        return (
          <div
            key={feed._id}
            ref={index === feeds.length - 1 ? lastFeedElementRef : null}
            className="rounded-lg overflow-hidden shadow-md w-full"
          >
            {/* Encabezado */}
            <div className="bg-black p-4 flex items-center gap-4 relative">
              <Link to={`/${feed.userId.username}/gallery`}>
                <img
                  src={feed.userId.photo || "/foto.jpeg"}
                  alt={`Foto de ${feed.userId.username}`}
                  className="w-10 h-10 rounded-full object-cover"
                  loading="lazy"
                />
              </Link>
              {feed.userId?.username ? (
                <Link
                  to={`/${feed.userId.username}/gallery`}
                  className="text-sm font-medium text-white"
                >
                  {feed.userId.username}
                </Link>
              ) : (
                <span className="text-gray-500">Usuario desconocido</span>
              )}
              <button
                className="absolute top-4 right-4 text-white"
                onClick={() => openOptionsModal(feed)}
                aria-label="Opciones"
              >
                <span className="text-2xl">⋮</span>
              </button>
            </div>

            {/* Sección de imagen/video */}
            <Link to={`/photo/${feed._id}`} className="block">
              <div className="w-full h-90 overflow-hidden relative">
                {feed.mediaType === "video" ? (
                  isUnlocked ? (
                    <video
                      src={finalSrc}
                      controls
                      className="w-full h-full object-cover"
                      preload="none"
                    />
                  ) : (
                    <img
                      src="/videos-miniatura.jpg"
                      alt="Video bloqueado"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )
                ) : feed.responsive && feed.responsive.length > 0 ? (
                  <picture>
                    {sortedResponsive.map((resp) => (
                      <source
                        key={resp.width}
                        srcSet={resp.url || finalSrc}
                        media={`(max-width: ${resp.width}px)`}
                      />
                    ))}
                    <img
                      src={finalSrc}
                      alt={feed.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </picture>
                ) : (
                  <img
                    src={finalSrc}
                    alt={feed.fileName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}

                {/* Overlay para contenido bloqueado (si no se ha desbloqueado) */}
                {!isUnlocked && feed.price > 0 && feed.mediaType !== "video" && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
                    onClick={() => openPhotoModal(feed)}
                  >
                    <img
                      src="/imagenblock.png"
                      alt="Imagen bloqueada"
                      className="h-24 w-24 object-contain"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </Link>

            {/* Botones Like / Comentarios */}
            <div className="p-1 flex items-center bg-black">
              <button
                onClick={() => toggleLike(feed._id)}
                className="like-button flex items-center text-white"
              >
                <img
                  src="/corazon.png"
                  alt="Like"
                  className="w-6 h-6 mr-2 object-contain"
                />
                {feed.likes.length}
              </button>
              <button
                onClick={() => {
                  setSelectedPhoto(feed);
                  setIsCommentModalOpen(true);
                }}
                className="flex items-center ml-4"
              >
                <img
                  src="/comment.png"
                  alt="Comentarios"
                  className="w-6 h-6 mr-2 object-contain"
                  loading="lazy"
                />
                <span className="text-white">{feed.comments.length}</span>
              </button>
            </div>

            {/* Descripción y precio */}
            <div className="flex items-center gap-2 px-4 py-1 -ml-2">
              <span className="font-montserrat font-bold text-white text-sm -ml-2">
                {feed.userId.username}
              </span>
              {feed.description && (
                <span className="text-white text-sm">{feed.description}</span>
              )}
            </div>
            <div className="-ml-4">
              {feed.category === "posts" && (
                <p className="text-white text-base px-4 mb-2">
                  {feed.price === 0
                    ? "Gratis"
                    : `Este post tiene un precio de $${feed.price} $${feed.currency}`}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* MODAL DE COMENTARIOS */}
      {isCommentModalOpen && selectedPhoto && (
        <CommentsModal
          photo={selectedPhoto}
          onClose={() => setIsCommentModalOpen(false)}
        />
      )}

      {/* MODAL DE ELIMINAR */}
      {isDeleteModalOpen && photoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-sm w-full">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              ✕
            </button>
            <p className="mb-4 text-black">
              ¿Estás seguro de eliminar esta foto?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleDelete(photoToDelete._id)}
              >
                Eliminar
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENÚ DE OPCIONES (reportar/eliminar) */}
      {isOptionsModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg relative max-w-sm w-full">
            <button
              className="absolute top-2 right-2 text-gray-600"
              onClick={closeOptionsModal}
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
            {selectedItem.userId._id === user?.id && (
              <button
                className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => handleDelete(selectedItem._id)}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE REPORTAR */}
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
    </div>
  );
}

export default Feed;
