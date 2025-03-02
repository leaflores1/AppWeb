import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Estados para dos contraseñas
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Para mostrar mensajes
  const [message, setMessage] = useState("");

  // Tomamos el token de la URL ?token=...
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Enviamos al endpoint
      const res = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword,
        confirmPassword,
      });

      setMessage(res.data.message || "¡Contraseña cambiada con éxito!");
      // Opcional: redirigir al login tras unos segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error interno");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md">
        <h2 className="text-black text-lg font-bold mb-4">Cambiar contraseña</h2>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="text-black border p-2 w-full mb-4"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="text-black border p-2 w-full mb-4"
        />

        <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-md w-full">
          Guardar nueva contraseña
        </button>

        {message && <p className="text-center text-black mt-4">{message}</p>}
      </form>
    </div>
  );
}
