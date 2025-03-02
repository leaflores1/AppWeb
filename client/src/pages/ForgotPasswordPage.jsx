import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setMessage(`Enviamos un correo electrónico a ${email} con un enlace para recuperar tu cuenta.`);
      setShowModal(true);
    } catch (error) {
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Error interno");
      }
      setShowModal(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-md">
        <h2 className="text-black text-lg font-bold mb-4">
          ¿Tienes problemas para iniciar sesión?
        </h2>
        <p className="text-black mb-2">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          className="border p-2 w-full mb-4"
        />
        <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded-md w-full">
          Enviar correo de recuperación
        </button>
      </form>

      {/* Modal confirmación */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md max-w-sm relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-2 right-2 text-gray-600"
            >
              ✕
            </button>
            <p className="text-black">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
