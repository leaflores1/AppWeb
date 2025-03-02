import { useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";

export default function HelpSettingsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [responseMsg, setResponseMsg] = useState({ text: "", isError: false });

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/support/help`, { subject, message }, {
        withCredentials: true,
      });

      setResponseMsg({ text: "✅ Mensaje enviado con éxito. Nuestro equipo te contactará pronto.", isError: false });
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("❌ Error al enviar mensaje de ayuda:", error);
      
      // Si el error es por endpoint no encontrado (404)
      if (error.response?.status === 404) {
        setResponseMsg({ text: "🚨 Error: Endpoint no encontrado. Contacta al soporte.", isError: true });
      } 
      // Si el error es por validación (400)
      else if (error.response?.status === 400) {
        setResponseMsg({ text: "⚠️ Debes completar todos los campos antes de enviar.", isError: true });
      } 
      // Otros errores
      else {
        setResponseMsg({ text: "❌ Hubo un error al enviar el mensaje. Inténtalo de nuevo más tarde.", isError: true });
      }
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-black text-2xl font-bold mb-4">Ayuda / Soporte</h2>
      
      {responseMsg.text && (
        <p className={`mb-4 text-sm font-semibold ${responseMsg.isError ? "text-red-500" : "text-green-500"}`}>
          {responseMsg.text}
        </p>
      )}

      <form onSubmit={handleSend}>
        <label className="block mb-4">
          <span className="text-gray-700">Asunto</span>
          <input
            type="text"
            className="text-black mt-1 block w-full border rounded p-2"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>

        <label className="block mb-4">
          <span className="text-gray-700">Mensaje</span>
          <textarea
            className="text-black mt-1 block w-full border rounded p-2"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Enviar Mensaje
        </button>
      </form>
    </div>
  );
}
