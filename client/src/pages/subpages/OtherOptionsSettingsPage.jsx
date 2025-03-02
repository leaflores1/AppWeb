import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";

export default function OtherOptionsSettingsPage() {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar tu cuenta? Esta acción es irreversible.")) {
      return;
    }

    try {
      // Endpoint hipotético que elimina la cuenta
      const res = await axios.delete(`${API_URL}/api/users/delete-account`, {
        withCredentials: true,
      });
      if (res.status === 200) {
        // Redirigir al home o pantalla de confirmación
        navigate("/");
      }
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      setMessage("No se pudo eliminar la cuenta. Intenta nuevamente.");
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-black text-2xl font-bold mb-4">Otras opciones</h2>
      {message && (
        <p className="mb-4 text-red-500 font-semibold">
          {message}
        </p>
      )}
      <p className="text-gray-700 mb-4">
        Desde aquí puedes eliminar permanentemente tu cuenta de localhost:3000. Recuerda que esta acción no se puede deshacer.
      </p>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        onClick={handleDeleteAccount}
      >
        Eliminar cuenta
      </button>
    </div>
  );
}
