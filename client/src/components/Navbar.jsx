import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ButtonLink } from "./ui/ButtonLink";
import { useState, useEffect, useRef } from "react";
import { getNotifications } from "../services/notiService";
import { API_URL } from "../config";
import CreateAlbumModal from "./CreateAlbumModal";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { io } from "socket.io-client";

export function Navbar() {
  const { isAuthenticated, logout, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const modalRef = useRef(null);
    // Ocultar la barra de búsqueda en la homepage (ruta "/")
  const isHomePage = location.pathname === "/";
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // Estado para el badge
  const [toastDisplayed, setToastDisplayed] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [unreadMessagesByChat, setUnreadMessagesByChat] = useState(() => {
    const saved = localStorage.getItem("unreadMessagesByChat");
    return saved ? JSON.parse(saved) : {};
  });
  // Calcular el total de mensajes nuevos sumando los contadores por chat.
  const totalNewMessages = Object.values(unreadMessagesByChat).reduce(
    (acc, curr) => acc + curr,
    0
  );

  //obtener notis con polling
  useEffect(() => {
    const fetchNotifications = async () => {
      if (isAuthenticated && user?.username) {
        try {
          const response = await getNotifications(user.username);
          const unread = response.filter((notif) => !notif.isRead);

          // Recuperar IDs ya mostrados del localStorage
          const displayedIds = JSON.parse(
            localStorage.getItem("displayedNotifs") || "[]"
          );
          const newNotifs = unread.filter(
            (notif) => !displayedIds.includes(notif._id)
          );

          if (newNotifs.length > 0) {
            const latestNotif = newNotifs[0];
            toast(
              `${latestNotif.senderUsername} ${
                latestNotif.type === "follow"
                  ? "empezó a seguirte"
                  : latestNotif.type === "like"
                  ? "le dio like a tu publicación"
                  : "comentó tu publicación"
              }`,
              {
                /* opciones del toast */
              }
            );
            // Agregar el id a los que ya se mostraron
            localStorage.setItem(
              "displayedNotifs",
              JSON.stringify([...displayedIds, latestNotif._id])
            );
          }

          setNotifications(response);
          setUnreadCount(unread.length);
        } catch (error) {
          console.error("Error al obtener notificaciones:", error);
        }
      }
    };

    fetchNotifications();
  }, [isAuthenticated, user?.username]);

  //obtener notis con websocket
  // Conexión a Socket.IO para notificaciones y mensajes
  useEffect(() => {
    if (isAuthenticated && user?.username) {
      const socket = io(API_URL);

      // Unirse a la sala del usuario usando "joinChat"
      socket.emit("joinChat", user.username);

      // Listener para notificaciones
      socket.on("notification", (newNotification) => {
        //console.log("Nueva notificación recibida:", newNotification);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast(
          `${newNotification.senderUsername} ${
            newNotification.type === "follow"
              ? "empezó a seguirte"
              : newNotification.type === "like"
              ? "le dio like a tu publicación"
              : "comentó tu publicación"
          }`,
          {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
          }
        );
      });

      // Listener para nuevos mensajes: se espera recibir el objeto con chatId
      socket.on("newMessage", (newMsg) => {
        //console.log("Nuevo mensaje recibido:", newMsg);
        setUnreadMessagesByChat((prev) => {
          const updated = { ...prev };
          // Incrementar la cuenta para el chat correspondiente
          if (updated[newMsg.chatId]) {
            updated[newMsg.chatId] += 1;
          } else {
            updated[newMsg.chatId] = 1;
          }
          localStorage.setItem("unreadMessagesByChat", JSON.stringify(updated));
          return updated;
        });
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user?.username]);

  const markAsRead = async () => {
    try {
      await axios.put(
        `${API_URL}/api/noti/notifications/read/${user.username}`
      );
      setUnreadCount(0); // Reinicia el contador después de marcar como leídas
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error("Error al marcar notificaciones como leídas:", error);
    }
  };

  // Cerrar el modal al hacer clic fuera del mismo
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setModalOpen(""); // Cerrar modal si se hace clic fuera
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Detectar cuando el usuario llegue al final del scroll
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight && hasMore) {
      loadMoreNotifications();
    }
  };

  // Función para cargar más notificaciones
  const loadMoreNotifications = async () => {
    try {
      const response = await getNotifications(user.username, page + 1);
      if (response.length > 0) {
        setNotifications((prev) => [...prev, ...response]);
        setPage(page + 1);
      } else {
        setHasMore(false); // No hay más notificaciones
      }
    } catch (error) {
      console.error("Error al cargar más notificaciones:", error);
    }
  };

  // Manejo de la búsqueda
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      // Verificar si el usuario existe
      await axios.get(`${API_URL}/api/profile/${searchQuery}`, {
        withCredentials: true,
      });
      navigate(`/${searchQuery}/gallery`); // Navegar al perfil si existe
      setSearchError(""); // Limpiar cualquier error previo
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setSearchError("Usuario no registrado");
      } else {
        console.error("Error al buscar usuario:", error);
      }
    }
  };

  const handleLogout = async () => {
    await logout(); // Llamar la función de logout desde el contexto
    navigate("/"); // Redirigir al home page después de cerrar sesión
  };

  useEffect(() => {
    const handleUnreadUpdate = () => {
      const stored = localStorage.getItem("unreadMessagesByChat");
      setUnreadMessagesByChat(stored ? JSON.parse(stored) : {});
    };
    window.addEventListener("unreadMessagesUpdated", handleUnreadUpdate);
    return () => {
      window.removeEventListener("unreadMessagesUpdated", handleUnreadUpdate);
    };
  }, []);

  const shouldRenderNavbar =
    !loading &&
    location.pathname !== "/login" &&
    location.pathname !== "/register";
;
  return (
    <>
      <nav className="bg-[#29b7f8] flex items-center justify-between py-1 px-10 mb-2 rounded-lg fixed top-0 w-full z-50 shadow-md -ml-5">
        {/* Logo */}
        <div className="flex-grow sm:flex-none flex justify-start">
          <Link to="/">
            <img
              src="/instagram-logo.png"
              alt="Logo"
              className="h-7 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Barra de búsqueda */}
      {(!isHomePage && !isRegisterPage && !isLoginPage) &&(
        <div className="lg:flex ml-auto flex pl-4">
          <input
            type="text"
            className="bg-white text-black w-full -py-1 px-4 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Buscar usuario..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchError(""); // Limpiar error al escribir algo nuevo
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            aria-label="Buscar usuario"
          />
          <button
            onClick={handleSearch}
            className="bg-white px-2 py-1 rounded-r-lg border border-l-0 border-gray-300"
            aria-label="Buscar"
          >
            <img
              src="/buscar.png"
              alt="Buscar"
              className="h-5 w-5 object-contain"
            />
          </button>
        </div>
        )}

        {searchError && (
          <p className="text-red-500 text-sm mt-1 ml-4">{searchError}</p>
        )}

        {/* Menú derecho */}
        <ul className="flex space-x-4 items-center ml-4">
          {isAuthenticated ? (
            <>
              <li className="ml-2 -mr-6">
                {" "}
                {/* Agrega ml-4 para moverlo más a la derecha */}
                <button
                  onClick={() =>
                    setModalOpen(modalOpen === "menu" ? "" : "menu")
                  }
                  className="text-white focus:outline-none"
                  aria-label="Abrir menú"
                >
                  <img src="/menu3.png" alt="Menú" className="h-8 w-8" />
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <ButtonLink to="/login">Iniciar sesión</ButtonLink>
              </li>
              <li>
                <ButtonLink to="/register">Registrarse</ButtonLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Modal Menú */}
      {isAuthenticated && modalOpen === "menu" && (
        <div
          ref={modalRef}
          className="fixed top-0 right-0 w-64 h-full bg-white shadow-lg z-50 overflow-hidden"
        >
          <div className="h-full overflow-auto p-4">
            <button
              onClick={() => setModalOpen("")}
              className="text-sky-400 font-bold mb-4"
              aria-label="Cerrar menú"
            >
              ✕ Cerrar
            </button>
            <div>
              <span className="block mb-4">Bienvenido/a {user.username}</span>
              <Link
                to="/feed"
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/hogar.png"
                  alt="Inicio"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Inicio
              </Link>

              <Link
                to={`/${user.username}/gallery`}
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/user.png"
                  alt="Mi perfil"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Mi perfil
              </Link>

              <button
                onClick={() => {
                  setModalOpen("notifications");
                  markAsRead();
                }}
                className="relative flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/notificacion.png"
                  alt="Notificaciones"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Notificaciones
                {unreadCount > 0 && (
                  <span className="absolute right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center mr-8">
                    {unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setModalOpen(""); // Cierra el navbar/modal
                  navigate("/inbox"); // Redirige a la sala de chat
                }}
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/correo.png"
                  alt="Mensajes"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Mensajes
                {totalNewMessages > 0 && (
                  <span className="ml-4 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalNewMessages}
                  </span>
                )}
              </button>

              <button
                onClick={() => setModalOpen("albums")}
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/album.png"
                  alt="Albums"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Crear álbums
              </button>

              <button
                onClick={() => {
                  window.location.href = `${API_URL}/api/mp/connect/${user.username}`;
                }}
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/cartera.png"
                  alt="Mercado Pago"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Vincular MP
              </button>

              {/* Botón de Configuración */}
              <Link
                to="/settings"
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full text-center mb-4"
              >
                <img
                  src="/config.png"
                  alt="Configuración"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Configuración
              </Link>

              <button
                onClick={() => handleLogout()}
                className="flex items-center bg-[#29b7f8] text-white px-4 py-2 rounded-md w-full"
                aria-label="Cerrar sesión"
              >
                <img
                  src="/logout.png"
                  alt="Cerrar sesión"
                  className="h-5 w-5 mr-3 object-contain"
                />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificaciones */}
      {isAuthenticated && modalOpen === "notifications" && (
        <div className="fixed top-0 right-0 w-66 h-full bg-white shadow-lg z-50">
          <div className="p-4">
            <button
              onClick={() => setModalOpen("")}
              className="text-sky-400 font-bold mb-4"
              aria-label="Cerrar notificaciones"
            >
              ✕ Cerrar
            </button>
            <h2 className="text-black text-lg font-bold mb-4">
              Notificaciones
            </h2>

            <ul
              className="max-h-[75vh] overflow-y-auto pr-4"
              onScroll={handleScroll}
            >
              {notifications.length === 0 ? (
                <li className="text-gray-500">No tienes notificaciones</li>
              ) : (
                notifications.map((notif, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 text-black mb-2"
                  >
                    {/* Avatar que redirige siempre al perfil del usuario */}
                    <Link to={`/${notif.senderUsername}/gallery`}>
                      <img
                        src={notif.senderPhoto || "/foto.jpeg"}
                        alt={notif.senderUsername}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </Link>

                    {/* Contenedor de texto y miniatura (si aplica) */}

                    <div className="flex items-center gap-2">
                      <Link
                        to={
                          notif.type === "follow"
                            ? `/${notif.senderUsername}/gallery`
                            : notif.mediaType === "video"
                            ? `/photo/${notif.referenceId}`
                            : `/photo/${notif.referenceId}`
                        }
                        className="text-blue-500 hover:underline"
                      >
                        {notif.type === "follow"
                          ? `${notif.senderUsername} empezó a seguirte`
                          : notif.type === "like"
                          ? notif.mediaType === "video"
                            ? `${notif.senderUsername} le dio like a tu video`
                            : `${notif.senderUsername} le dio like a tu publicación`
                          : notif.type === "comment"
                          ? notif.mediaType === "video"
                            ? `${notif.senderUsername} comentó tu video`
                            : `${notif.senderUsername} comentó tu publicación`
                          : ""}
                      </Link>
{/*  
                      {(notif.type === "like" || notif.type === "comment") &&
                        notif.mediaType !== "video" && (
                          <Link to={`/photo/${notif.referenceId}`}>
                            <img
                              src={getThumbnailUrl(notif.referenceId)}
                              alt="Miniatura de la foto"
                              className="w-8 h-8 object-cover rounded"
                            />
                          </Link>
                        )}*/}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Modal Álbums */}
      {isAuthenticated && modalOpen === "albums" && (
        <CreateAlbumModal user={user} onClose={() => setModalOpen("")} />
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}
