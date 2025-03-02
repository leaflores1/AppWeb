import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config";
import ImageCropper from "../components/ImageCropper";

function CreatePost({ username, userId, category, onClose, setPhotos }) {
  const [post, setPost] = useState({
    photo: null,
    description: "",
    price: 0,
    currency: "ARS",
  });
  const [localCategory, setLocalCategory] = useState(category);
  const [message, setMessage] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [fileToCrop, setFileToCrop] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isSellerLinked, setIsSellerLinked] = useState(null);

  // Verificar si el usuario tiene una cuenta vinculada a Mercado Pago
  useEffect(() => {
    const checkSellerStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/mp/check_seller`, {
          withCredentials: true,
        });
        setIsSellerLinked(res.data.isLinked); // true si está vinculado, false si no
      } catch (error) {
        console.error("Error verificando Mercado Pago:", error);
        setIsSellerLinked(false);
      }
    };
    checkSellerStatus();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isImage = file.type.startsWith("image") && !file.type.includes("gif");

      setFileName(file.name);
      if (isImage) {
        setFileToCrop(file);
        setShowCropper(true);
      } else {
        setPost((prev) => ({ ...prev, photo: file })); // No recortar videos o gifs
      }
    }
  };

  const handleCropComplete = (croppedFile) => {
    setShowCropper(false);
    setFileToCrop(null);
    setPost((prev) => ({ ...prev, photo: croppedFile }));
    setFileName(croppedFile.name);
  };

  useEffect(() => {
    async function fetchCurrency() {
      try {
        const res = await axios.get(`${API_URL}/api/mp/get_currency`, {
          withCredentials: true,
        });
        setPost((prev) => ({ ...prev, currency: res.data.currency }));
      } catch (error) {
        console.error("Error al obtener la moneda:", error);
      }
    }

    fetchCurrency();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!post.photo) {
      setMessage("Por favor, selecciona una foto o video antes de subirla.");
      return;
    }
      // ❌ Bloquear si la cuenta NO está vinculada y el usuario intenta crear un post pago
      if (localCategory === "posts" && post.price > 0 && !isSellerLinked) {
        setMessage("Debes vincular tu cuenta a Mercado Pago.");
        return;
      }

    const formData = new FormData();
    formData.append("photo", post.photo);
    formData.append("description", post.description);
    formData.append("price", localCategory === "posts" ? parseFloat(post.price) || 0 : 0);
    formData.append("currency", post.currency);
    formData.append("userId", userId);
    formData.append("category", localCategory);

    try {
      const response = await axios.post(
        `${API_URL}/api/photos/upload/${username}/${localCategory}`,
        formData,
        { withCredentials: true }
      );
      setMessage("Contenido subido con éxito.");
      if (localCategory === category) {
        setPhotos((prev) => [...prev, response.data]);
      }
      onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        setMessage(error.response.data);
      } else {
        setMessage("Error al subir el contenido. Intenta nuevamente.");
      }
      console.error("Error al subir:", error);
    }
  };

  return (
    <div className="modaleditarperfil">
      {showCropper && fileToCrop ? (
        <ImageCropper
          file={fileToCrop}
          onCancel={() => {
            setShowCropper(false);
            setFileToCrop(null);
          }}
          onComplete={handleCropComplete}
        />
      ) : (
        <form onSubmit={handleSubmit} className="edit-profile-form">
          <h2 className="bg-white text-black text-xl font-bold mb-4">Crear Post</h2>

          <label className="bg-white text-black block mb-2">
            Foto o Video:
            <div className="mt-2 flex items-center gap-2">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="border rounded px-2 py-1 w-full"
              />
              {fileName && (
                <span className="text-gray-500 text-sm italic truncate">{fileName}</span>
              )}
            </div>
          </label>

          <label className="block mb-4 text-black">
            Descripción:
            <textarea
              value={post.description}
              onChange={(e) => setPost({ ...post, description: e.target.value })}
              placeholder="Escribe una descripción..."
              className="block mt-2 border rounded px-2 py-1 w-full"
            />
          </label>

          <label className="block mb-4 text-black">
            Categoría:
            <select
              value={localCategory}
              onChange={(e) => setLocalCategory(e.target.value)}
              className="block mt-2 border rounded px-2 py-1 w-full"
            >
              <option value="gallery">Galería</option>
              <option value="posts">Posts</option>
            </select>
          </label>

          {localCategory === "posts" && (
            <label className="block mb-4 text-black">
              Precio ({post.currency})
              <input
                type="number"
                value={post.price}
                onChange={(e) => setPost({ ...post, price: e.target.value })}
                placeholder="Ingresa un valor"
                className="block mt-2 border rounded px-2 py-1 w-full"
              />
            </label>
          )}

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
            <button type="submit" className="guardar-button">Subir</button>
            <button type="button" onClick={onClose} className="cancelar-button">Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreatePost;
