import { useAuth } from "../context/AuthContext";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

import CreatePost from "./CreatePost";
import EditProfile from "./EditProfile";
import FollowButton from "../components/FollowButton";
import { usePhotos } from "../hooks/usePhotos";
import { useProfile } from "../hooks/useProfile";
import { API_URL } from "../config";
import { deletePhoto } from "../services/photoService";
import { useAlbums } from "../hooks/useAlbums";
import AlbumModal from "../components/AlbumModal";
import PhotoModal from "../components/PhotoModal";

function Profile() {
  // Autenticación
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const mpLinked = queryParams.get("mpLinked");

  // Rutas
  const { username, category: categoryParam } = useParams();

  const navigate = useNavigate();

  // Categoría actual (gallery, posts, albums)
  const [category, setCategory] = useState(categoryParam || "gallery");

  // Hooks para cargar fotos y álbumes
  const { photos, setPhotos } = usePhotos(
    username,
    category === "albums" ? "gallery" : category
  );
  const { albums, setAlbums } = useAlbums(username);

  // Datos del perfil
  const { profileData, setProfileData } = useProfile(username);
  const [message, setMessage] = useState("");

  // Modales de foto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Modales de álbum
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // Modo de edición (profile vs. post)
  const [editMode, setEditMode] = useState(null);

  // Manejo de eliminación de foto
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  // Seguidores/Seguidos
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [followingList, setFollowingList] = useState([]);

  // Opciones (bloquear / reportar)
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Mapa para presigned URLs de fotos pagas
  const [presignedMap, setPresignedMap] = useState({});

  // Referencias para videos en miniatura
  const videoRefs = useRef({});
  const albumVideoRefs = useRef({});

   // Asegúrate de declarar showMpToast
   const [showMpToast, setShowMpToast] = useState(false);

  // Si no está autenticado, redirige a login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Muestra el toast de vinculación exitosa si se recibe el parámetro mpLinked
  useEffect(() => {
    if (mpLinked === "1") {
      setShowMpToast(true);
      const timer = setTimeout(() => {
        setShowMpToast(false);
        // Si deseas redirigir luego de mostrar el toast, puedes hacerlo aquí
        // navigate(`/${username}/gallery`);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mpLinked, username, navigate]);

  //------------------------------------
  // LOGICA PARA PRESIGNED URLs
  //------------------------------------

  const isPostUnlocked = (photo) => {
    const isPaid = photo.isPaidContent;
    const isOwner = photo.userId === user.id;
    const purchased = photo.unlockedBy?.some((id) => id.toString() === user.id);
    // Si es de pago y es el dueño => debe verla bloqueada
    if (isPaid && isOwner) {
      return false;
    }
    // Si es gratis, está desbloqueada
    if (!isPaid) {
      return true;
    }
    // Si es comprada => desbloqueada
    return purchased;
  };

  // Función para solicitar presigned URL de una foto desbloqueada
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

  useEffect(() => {
    photos.forEach((photo) => {
      if (
        photo.isPaidContent &&
        isPostUnlocked(photo) &&
        !presignedMap[photo._id]
      ) {
        fetchPaidPhotoUrl(photo._id);
      }
    });
  }, [photos]);

  //------------------------------------
  // Manejo de modales de foto
  //------------------------------------
  const openPhotoModal = (photo) => {
    if (photo.mediaType === "video" && videoRefs.current[photo._id]) {
      const videoElement = videoRefs.current[photo._id];
      videoElement.pause();
      videoElement.controls = false;
    }
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const closePhotoModal = () => {
    if (
      selectedPhoto?.mediaType === "video" &&
      videoRefs.current[selectedPhoto._id]
    ) {
      const videoElement = videoRefs.current[selectedPhoto._id];
      videoElement.controls = true;
    }
    setSelectedPhoto(null);
    setIsModalOpen(false);
  };

  // Eliminar foto
  const handleDelete = async (photoId) => {
    const success = await deletePhoto(photoId);
    if (success) {
      setPhotos(photos.filter((p) => p._id !== photoId));
      setMessage("Foto eliminada con éxito");
      setIsDeleteModalOpen(false);
      if (selectedPhoto && selectedPhoto._id === photoId) {
        closePhotoModal();
      }
    } else {
      setMessage("No se pudo eliminar la foto");
    }
  };

  //------------------------------------
  // Manejo de álbumes
  //------------------------------------
  useEffect(() => {
    albums.forEach((album) => {
      if (album.photos.length > 0) {
        const firstPhoto = album.photos[0];

        if (
          firstPhoto.isPaidContent &&
          (album.unlockedBy.includes(user.id) || album.price === 0) &&
          !presignedMap[firstPhoto._id]
        ) {
          fetchPaidPhotoUrl(firstPhoto._id);
        }
      }
    });
  }, [albums]);

  const openAlbumModal = (album) => {
    if (album.photos.length > 0 && album.photos[0].mediaType === "video") {
      const videoElement = albumVideoRefs.current[album._id];
      if (videoElement) {
        videoElement.pause();
      }
    }
    setSelectedAlbum(album);
    setIsAlbumModalOpen(true);
  };

  const closeAlbumModal = () => {
    setSelectedAlbum(null);
    setIsAlbumModalOpen(false);
  };

  const handleAlbumUpdated = (updatedAlbum) => {
    setAlbums((prev) =>
      prev.map((alb) => (alb._id === updatedAlbum._id ? updatedAlbum : alb))
    );
    closeAlbumModal();
  };

  //------------------------------------
  // Bloquear usuario
  //------------------------------------
  const handleBlockUser = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/block/block`,
        { userId: profileData._id },
        {
          withCredentials: true,
        }
      );
      if (response.status === 200) {
        alert("Usuario bloqueado exitosamente.");
        setIsOptionsModalOpen(false);
      }
    } catch (error) {
      console.error("Error al bloquear el usuario:", error);
    }
  };

  //------------------------------------
  // Reportar usuario
  //------------------------------------
  const handleSubmitReport = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/report/reportprofile`,
        {
          reportedUserId: profileData._id,
          itemType: "user",
          reason: reportReason,
          description: reportDescription,
        },
        { withCredentials: true }
      );
      if (response.status === 200) {
        alert("Reporte enviado exitosamente.");
        setIsReportModalOpen(false);
        setIsOptionsModalOpen(false);
        setReportReason("");
        setReportDescription("");
      }
    } catch (error) {
      console.error("Error al reportar al usuario:", error);
      alert("Error al enviar el reporte.");
    }
  };

  //------------------------------------
  // Mensaje / chat
  //------------------------------------
  const handleSendMessage = async () => {
    if (!profileData || !profileData._id) {
      console.error("Datos de perfil no cargados.");
      return;
    }
    if (profileData._id === user.id) {
      console.error("No puedes iniciar un chat contigo mismo.");
      return;
    }
    try {
      const res = await axios.post(
        `${API_URL}/api/chats/start`,
        { recipientId: profileData._id },
        { withCredentials: true }
      );
      navigate(`/inbox/${res.data._id}`);
    } catch (error) {
      console.error(
        "Error al iniciar chat:",
        error.response?.data || error.message
      );
    }
  };

  //------------------------------------
  // Seguidores / Seguidos
  //------------------------------------
  const openFollowersModal = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profile/${username}/followers`,
        {
          withCredentials: true,
        }
      );
      setFollowersList(response.data);
      setIsFollowersModalOpen(true);
    } catch (error) {
      console.error("Error al obtener seguidores:", error);
    }
  };
  const closeFollowersModal = () => {
    setIsFollowersModalOpen(false);
    setFollowersList([]);
  };

  const openFollowingModal = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/profile/${username}/following`,
        {
          withCredentials: true,
        }
      );
      setFollowingList(response.data);
      setIsFollowingModalOpen(true);
    } catch (error) {
      console.error("Error al obtener seguidos:", error);
    }
  };
  const closeFollowingModal = () => {
    setIsFollowingModalOpen(false);
    setFollowingList([]);
  };

  //------------------------------------
  // Manejadores para modal de crear post y editar perfil
  //------------------------------------
  const handleOpenCreatePost = () => {
    setIsModalOpen(true);
    setEditMode("profile");
  };

  const handleOpenEditProfile = () => {
    setIsModalOpen(true);
    setEditMode("editProfile");
  };
  //console.log("Datos del perfil:", profileData);

  //------------------------------------
  // Render principal
  //------------------------------------
  return (
    <div>
       {/* Toast de vinculación exitosa */}
       {showMpToast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50">
          ¡Vinculación exitosa con Mercado Pago!
        </div>
      )}
      {/* Encabezado */}
      <div className="bg-black py-4 mt-12 ">
        <div className="flex flex-col sm:flex-row">
          {/* Columna izquierda: foto de perfil + botones */}
          <div className="flex flex-col items-center sm:space-x-8">
            <img
              src={profileData.photo}
              alt="Foto de perfil"
              className="h-32 w-32 sm:h-40 sm:w-40 rounded-full object-cover sm:justify-center"
              loading="lazy"
            />
            <div className="flex items-center flex-wrap sm:flex-nowrap justify-center gap-2 mb-2">
              {user.username === username ? (
                <>
                  <button
                    onClick={handleOpenEditProfile}
                    className="edit-button flex-shrink-0 flex-grow"
                  >
                    Editar perfil
                  </button>
                  <button
                    onClick={handleOpenCreatePost}
                    className="edit2-button flex-shrink-0 flex-grow"
                  >
                    Crear +
                  </button>
                </>
              ) : (
                <>
                  <FollowButton username={username} />
                  <button
                    onClick={handleSendMessage}
                    className="edit-button flex-shrink-0 flex-grow"
                  >
                    Mensaje
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Columna derecha: datos de perfil */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left sm:ml-8">
            <div className="flex items-center justify-center sm:justify-start">
              <h1 className="text-white text-xl sm:text-2xl">
                {profileData.nombre}
              </h1>
              {/* Icono de Instagram con enlace al perfil del usuario */}
              {profileData.instagram && (
                <a
                  href={`https://www.instagram.com/${profileData.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2"
                >
                  <img src="/ig.png" alt="Instagram" className="w-5 h-5 ml-2" />
                </a>
              )}
              <button
                onClick={() => setIsOptionsModalOpen(true)}
                className="ml-4 text-white text-2xl"
                title="Más opciones"
              >
                ⋮
              </button>
            </div>
            <h2 className="text-gray-400 text-sm sm:text-base mt-1">
              localhost:3000.com/{profileData.username}
            </h2>
            <div className="flex space-x-4 mt-1">
              <span
                className="text-sm text-gray-400 cursor-pointer"
                onClick={openFollowersModal}
              >
                {profileData.followers} seguidores
              </span>
              <span
                className="text-sm text-gray-400 cursor-pointer"
                onClick={openFollowingModal}
              >
                {profileData.following} seguidos
              </span>
            </div>
            <p className="profile-description text-white text-[14px] mt-1 flex-grow">
              {profileData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Menú de categorías */}
      <div className="flex flex-wrap sm:flex-nowrap justify-center sm:justify-start space-x-2 space-y-2 sm:space-y-0 border-b-custom pb-2 px-4 sm:px-10">
        <button
          onClick={() => {
            setCategory("gallery");
            navigate(`/${username}/gallery`);
          }}
          className={`button-post px-3 py-1 text-sm sm:text-base ${
            category === "gallery" ? "active" : ""
          }`}
        >
          Galería
        </button>

        <button
          onClick={() => {
            setCategory("posts");
            navigate(`/${username}/posts`);
          }}
          className={`button-post flex items-center justify-center px-3 py-1 text-sm sm:text-base ${
            category === "posts" ? "active" : ""
          }`}
          style={{ paddingLeft: "10px" }}
        >
          <img
            src="/candado.png"
            alt="Posts"
            className="h-3 w-4 mr-2 object-contain"
          />
          Posts
        </button>

        <button
          onClick={() => {
            setCategory("albums");
            navigate(`/${username}/albums`);
          }}
          className={`button-post px-3 py-1 text-sm sm:text-base ${
            category === "albums" ? "active" : ""
          }`}
        >
          Albums
        </button>
      </div>

      {/* LISTADO DE ALBUMS */}
      {category === "albums" ? (
        <div className="bg-black grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
          {albums.map((album) => {
            const isAlbumUnlocked =
              album.price === 0 || album.unlockedBy?.includes(user.id);

            // Miniatura por defecto
            let albumThumbnail = "/albums-miniatura.jpg";

            // Si el álbum está desbloqueado y tiene al menos una foto
            const firstPhoto = album.photos.length > 0 ? album.photos[0] : null;

            return (
              <div
                key={album._id}
                className="relative w-full aspect-square cursor-pointer overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
                onClick={() => openAlbumModal(album)}
              >
                {/* Si está desbloqueado y la primera publicación es un video, mostrar el video pausado */}
                {isAlbumUnlocked && firstPhoto?.mediaType === "video" ? (
                  <video
                    className="w-full h-full object-cover"
                    src={presignedMap[firstPhoto._id] || firstPhoto.s3Url}
                    muted
                  />
                ) : (
                  // Si es una imagen o el álbum está bloqueado, mostrar la miniatura
                  <img
                    src={
                      isAlbumUnlocked && firstPhoto
                        ? presignedMap[firstPhoto._id] || firstPhoto.s3Url
                        : "/albums-miniatura.jpg"
                    }
                    alt="Miniatura del álbum"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Título del álbum */}
                <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-70 p-1 text-center text-white truncate text-sm sm:text-base md:text-lg lg:text-base xl:text-xl">
                  {album.title}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // LISTADO DE FOTOS (gallery / posts)
        <div className="bg-black grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4">
          {photos.map((photo) => {
            const unlocked = isPostUnlocked(photo);

            const finalSrc =
              photo.isPaidContent && !unlocked
                ? photo.mediaType === "video"
                  ? "/videos-miniatura.jpg" // Miniatura para videos bloqueados
                  : photo.blurUrl // Blur o fallback para imágenes bloqueadas
                : presignedMap[photo._id] || photo.s3Url;

            return (
              <div
                key={photo._id}
                className="relative w-full aspect-square cursor-pointer overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
              >
                {photo.mediaType === "video" ? (
                  unlocked ? (
                    <video
                      ref={(el) => (videoRefs.current[photo._id] = el)}
                      className="w-full h-full object-cover"
                      src={presignedMap[photo._id] || photo.s3Url}
                      muted
                      onClick={() => openPhotoModal(photo)}
                    />
                  ) : (
                    <img
                      src="/videos-miniatura.jpg"
                      alt="Video bloqueado"
                      className="w-full h-full object-cover"
                      onClick={() => openPhotoModal(photo)}
                    />
                  )
                ) : (
                  <img
                    src={finalSrc}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                    onClick={() => openPhotoModal(photo)}
                  />
                )}

                {/* Overlay si NO está desbloqueado y es de pago y es una imagen */}
                {!unlocked &&
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
            );
          })}
        </div>
      )}

      {/* MODAL DE FOTO INDIVIDUAL */}
      {isModalOpen && selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={closePhotoModal} />
      )}

      {/* MODAL ELIMINAR FOTO */}
      {isDeleteModalOpen && photoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center items-center z-[1000]">
          <div className="bg-white p-6 rounded shadow-lg relative">
            <p>¿Estás seguro de que deseas eliminar esta foto?</p>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={async () => {
                await handleDelete(photoToDelete._id);
                closePhotoModal();
              }}
            >
              Eliminar
            </button>
            <button
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CREAR POST */}
      {isModalOpen && !selectedPhoto && editMode === "profile" && (
        <CreatePost
          username={username}
          userId={user.id}
          category={category}
          onClose={() => {
            setIsModalOpen(false);
            setEditMode(null);
          }}
          setPhotos={setPhotos}
        />
      )}

      {/* MODAL EDITAR PERFIL */}
      {isModalOpen && editMode === "editProfile" && (
        <EditProfile
          username={username}
          onClose={() => {
            setIsModalOpen(false);
            setEditMode(null);
          }}
          setProfileData={setProfileData}
          existingProfile={profileData}
        />
      )}

      {/* MODAL DE ÁLBUM */}
      {isAlbumModalOpen && selectedAlbum && (
        <AlbumModal
          album={selectedAlbum}
          user={user}
          onClose={closeAlbumModal}
          onDeleteAlbum={(albumId) => {
            setAlbums((prev) => prev.filter((a) => a._id !== albumId));
          }}
          onAlbumUpdated={handleAlbumUpdated}
        />
      )}

      {/* MODAL DE SEGUIDORES */}
      {isFollowersModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md relative">
            <button
              onClick={closeFollowersModal}
              className="absolute top-2 right-2 text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-black text-lg font-bold mb-4">Seguidores</h2>
            <ul className="space-y-2">
              {followersList.map((follower, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    closeFollowersModal();
                    navigate(`/${follower.username}/gallery`);
                  }}
                >
                  <img
                    src={follower.photo || "/foto.jpeg"}
                    alt={follower.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-black">{follower.username}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODAL DE SEGUIDOS */}
      {isFollowingModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-md w-full max-w-md relative">
            <button
              onClick={closeFollowingModal}
              className="absolute top-2 right-2 text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-black text-lg font-bold mb-4">Seguidos</h2>
            <ul className="space-y-2">
              {followingList.map((followed, idx) => (
                <li
                  key={idx}
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => {
                    closeFollowingModal();
                    navigate(`/${followed.username}/gallery`);
                  }}
                >
                  <img
                    src={followed.photo || "/default-profile.png"}
                    alt={followed.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-black">{followed.username}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MENÚ DE OPCIONES (BLOQUEAR / REPORTAR) */}
      {isOptionsModalOpen && (
        <div className="text-black fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-lg relative">
            <button
              onClick={() => setIsOptionsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-600"
            >
              ✕
            </button>
            <h3 className="text-lg font-bold mb-4">Opciones</h3>
            <ul>
              <li>
                <button
                  onClick={handleBlockUser}
                  className="block w-full text-left p-2 hover:bg-gray-200"
                >
                  Bloquear usuario
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="block w-full text-left p-2 hover:bg-gray-200"
                >
                  Reportar usuario
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL PARA REPORTAR USUARIO */}
      {isReportModalOpen && (
        <div className="text-black fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-80">
            <h3 className="text-lg font-bold mb-4">Reportar usuario</h3>
            <label className="block mb-2">
              Razón:
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="">Selecciona una razón</option>
                <option value="spam">Spam</option>
                <option value="abuso">Abuso</option>
                <option value="contenido inapropiado">
                  Contenido inapropiado
                </option>
              </select>
            </label>
            <label className="block mb-2">
              Descripción (opcional):
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="w-full p-2 border rounded mt-1"
                rows="3"
                placeholder="Detalles adicionales..."
              />
            </label>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitReport}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Enviar reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
