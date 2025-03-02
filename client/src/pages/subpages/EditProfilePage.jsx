import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../config";
import { useAuth } from "../../context/AuthContext";
import { useProfile } from "../../hooks/useProfile";

/**
 * EditProfilePage
 * Permite editar la foto de perfil, nombre completo y descripción.
 */
export default function EditProfilePage() {
  const { user } = useAuth(); // Usuario autenticado
  const { profileData, fetchProfile, setProfileData } = useProfile(
    user?.username
  );

  // Estados locales para los campos del perfil
  const [profilePhoto, setProfilePhoto] = useState("/foto.jpeg");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("")
  const [message, setMessage] = useState("");

  // Cargar los datos existentes en los campos
  useEffect(() => {
    setProfilePhoto(profileData.photo || "/foto.jpeg");
    setNombreCompleto(profileData.nombre || "");
    setInstagram(profileData.instagram  || "");
    setDescription(profileData.description || "");
  }, [profileData]);

  // Manejar la actualización del perfil
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("description", description);
    formData.append("nombre", nombreCompleto);
    formData.append("instagram", instagram);

    if (profilePhoto) {
      formData.append("photo", profilePhoto); // Asegúrate de que este campo se agrega correctamente
    }

    try {

      const response = await axios.put(
        `${API_URL}/api/profile/upload/${user.username}/update-profile`,
        formData,
        {
          withCredentials: true,
        }
      );

      setMessage("Perfil actualizado correctamente");
      fetchProfile();
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage("Error al actualizar perfil");
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded max-w-2xl mx-auto text-black">
      <h2 className="text-2xl font-bold mb-4">Editar Perfil</h2>

      {message && (
        <p
          className={`mb-4 ${
            message.includes("Error") ? "text-red-500" : "text-green-500"
          }`}
        >
          {message}
        </p>
      )}

      {/* Vista previa de la foto de perfil actual */}
      <div className="flex items-center mb-4">
        <img
          src={profilePhoto}
          alt="Foto de perfil"
          className="w-16 h-16 rounded-full object-cover mr-4"
        />
        <p className="text-gray-600">Foto de perfil actual</p>
      </div>

      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">
            Nueva foto de perfil:
          </span>
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={(e) => setProfilePhoto(e.target.files[0])}
            className="mt-1 block w-full"
          />
        </label>

        {/* Input para nombre completo */}
        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Nombre completo:</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={nombreCompleto}
            onChange={(e) => setNombreCompleto(e.target.value)}
          />
        </label>

        {/* Input para instagram*/}
        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Agrega o modifica tu cuenta de Instagram:</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded p-2"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </label>


        {/* Textarea para la descripción */}
        <label className="block mb-4">
          <span className="text-gray-700 font-semibold">Descripción:</span>
          <textarea
            className="mt-1 block w-full border rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
