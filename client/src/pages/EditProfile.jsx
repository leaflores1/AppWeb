import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config";

function EditProfile({ username, onClose, setProfileData, existingProfile }) {
  // Estados locales
  const [profilePhoto, setProfilePhoto] = useState(existingProfile?.photo || null);
  const [description, setDescription] = useState(existingProfile?.description || "");
  const [nombre, setNombre] = useState(existingProfile?.nombre || ""); // ← NUEVO
  const [message, setMessage] = useState("");

  const handlePhotoChange = (e) => {
    setProfilePhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profilePhoto && !description && !nombre) {
      setMessage("Por favor, ingresa al menos un cambio: foto, descripción o nombre.");
      return;
    }

    const formData = new FormData();
    if (profilePhoto) formData.append("photo", profilePhoto);
    formData.append("description", description);
    formData.append("nombre", nombre); // ← NUEVO

    try {
      const response = await axios.put(
        `${API_URL}/api/profile/upload/${username}/update-profile`,
        formData,
        {
          withCredentials: true,

        }
      );

      setMessage("Perfil actualizado con éxito.");

      // Actualiza el estado global del perfil
      setProfileData((prev) => ({
        ...prev,
        photo: response.data.photo || prev.photo,
        description: response.data.description || prev.description,
        nombre: response.data.nombre || prev.nombre, // ← Actualizamos nombre en el estado global
      }));

      onClose(); // Cierra el modal
    } catch (error) {
      setMessage("Error al actualizar el perfil. Intenta nuevamente.");
      console.error("Error al actualizar el perfil:", error);
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <div className="modaleditarperfil">
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <h2 className="bg-white text-black text-xl font-bold mb-4">Editar Perfil</h2>

        {/* Campo para la foto */}
        <label className="bg-white text-black block mb-2">
          Foto de perfil:
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="block mt-2 border rounded px-2 py-1 w-full"
          />
        </label>

        {/* Campo para el nombre */}
        <label className="block mb-4 text-black">
          Nombre completo:
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="block mt-2 border rounded px-2 py-1 w-full"
          />
        </label>

        {/* Campo para la descripción */}
        <label className="block mb-4 text-black">
          Descripción:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Escribe una descripción..."
            className="block mt-2 border rounded px-2 py-1 w-full"
            rows="4"
          />
        </label>

        {message && (
          <p
            className={`text-center font-bold mb-4 ${
              message.includes("Error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </p>
        )}

        <div className="flex justify-end space-x-2">
          <button type="submit" className="guardar-button">
            Guardar Cambios
          </button>
          <button type="button" onClick={handleClose} className="cancelar-button">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProfile;
