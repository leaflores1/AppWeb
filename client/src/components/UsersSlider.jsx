import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useNavigate } from "react-router-dom";
// Opcional: usar íconos
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

function UsersSlider() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  // Referencia al contenedor de usuarios
  const sliderRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/users/public`)
      .then((response) => {
        setUsers(response.data);
      })
      .catch((error) => {
        console.error("Error al obtener usuarios públicos:", error);
      });
  }, []);

  // Funciones para desplazar el contenedor
  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="relative max-w-full py-4">
      {/* Flecha izquierda - se oculta en móviles: hidden en pantallas menores a md */}
      <button
        onClick={scrollLeft}
        className="hidden md:flex items-center justify-center absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 rounded-full w-8 h-8 text-white"
      >
        <FaChevronLeft />
      </button>

      {/* Contenedor con scroll horizontal y flex-nowrap */}
      <div
        ref={sliderRef}
        className="overflow-x-auto flex flex-nowrap space-x-6 px-4 scrollbar-hide"
      >
        {users.map((user) => (
          <div
            key={user._id}
            className="flex-shrink-0 flex flex-col items-center min-w-[100px]"
          >
            <img
              src={user.photo || "/foto.jpeg"}
              alt={user.username}
              className="rounded-full object-cover w-28 h-28"
            />
            <span
              className="text-sm text-white mt-2 cursor-pointer"
              onClick={() => navigate(`/${user.username}`)}
            >
              {user.username}
            </span>
          </div>
        ))}
      </div>

      {/* Flecha derecha - se oculta en móviles */}
      <button
        onClick={scrollRight}
        className="hidden md:flex items-center justify-center absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 rounded-full w-8 h-8 text-white"
      >
        <FaChevronRight />
      </button>
    </div>
  );
}

export default UsersSlider;
