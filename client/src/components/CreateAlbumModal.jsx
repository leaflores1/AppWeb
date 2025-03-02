import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";
import ImageCropper from "./ImageCropper";

export default function CreateAlbumModal({ user, onClose, onAlbumCreated }) {
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [cropQueue, setCropQueue] = useState([]);
  const [currency, setCurrency] = useState("ARS"); 
  const [isSellerLinked, setIsSellerLinked] = useState(null);

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

  useEffect(() => {
    const objectUrls = files.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" : "image",
    }));
    setPreviews(objectUrls);

    return () => {
      objectUrls.forEach(({ url }) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    selectedFiles.forEach((file) => {
      if (file.type.startsWith("image") && file.type !== "image/gif") {
        setCropQueue((prevQueue) => [...prevQueue, file]);
      } else {
        setFiles((prevFiles) => [...prevFiles, file]);
      }
    });
  };

  const handleCropComplete = (croppedFile) => {
    setFiles((prevFiles) => [...prevFiles, croppedFile]);
    setCropQueue((prevQueue) => prevQueue.slice(1));
  };

  const handleCropCancel = () => {
    setCropQueue((prevQueue) => prevQueue.slice(1));
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setMessage("El título no puede estar vacío.");
      return;
    }
    if (files.length === 0) {
      setMessage("Selecciona al menos una foto o video.");
      return;
    }
    if (price > 0 && !isSellerLinked) {
      setMessage("Debes vincular tu cuenta a Mercado Pago.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("title", title);
      formData.append("price", parseFloat(price) || 0);
      formData.append("currency", currency); 
      formData.append("description", description);

      files.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await axios.post(
        `${API_URL}/api/albums/create`,
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMessage("Álbum creado con éxito.");
      if (onAlbumCreated) onAlbumCreated(response.data);
      onClose();

    } catch (error) {
      console.error("Error al crear el álbum:", error);
      setMessage("Ocurrió un error al crear el álbum.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-2 md:p-0">
      <div className="bg-white w-full h-full md:w-[80%] md:max-h-[80vh] md:rounded-lg relative max-w-4xl flex flex-col overflow-hidden">
        <div className="overflow-auto flex-grow p-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-black bg-gray-200 px-2 py-1 rounded"
          >
            ✕
          </button>

          <h2 className="text-black text-xl font-bold mb-4 text-center md:text-left">
            Crear Nuevo Álbum
          </h2>

          {message && <p className="text-center text-red-500 mb-2">{message}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col">
            <label className="text-black block mb-4">
              <span>Título del álbum:</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-black border w-full p-2 mt-1 rounded"
              />
            </label>

            <label className="text-black block mb-4">
              <span>Descripción del álbum:</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-black border w-full p-2 mt-1 rounded"
                rows="3"
              />
            </label>

            <label className="text-black block mb-4">
              <span>Precio ({currency})</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="text-black border w-full p-2 mt-1 rounded"
              />
            </label>

            <label className="block mb-4">
              <span>Seleccionar fotos o videos:</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="mt-1"
              />
            </label>

            {previews.length > 0 && (
              <div className="max-h-48 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4 border p-2 rounded">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group w-full h-24 md:h-28 lg:h-32">
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>

                    {preview.type === "video" ? (
                      <video
                        src={preview.url}
                        className="w-full h-full object-cover border border-gray-300"
                        controls
                      />
                    ) : (
                      <img
                        src={preview.url}
                        alt={`preview-${idx}`}
                        className="w-full h-full object-cover border border-gray-300 rounded"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="sticky bottom-0 bg-white p-2 border-t">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded w-full md:w-auto"
              >
                Subir Álbum
              </button>
            </div>
          </form>
        </div>
      </div>

      {cropQueue.length > 0 && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-70 flex justify-center items-center">
          <ImageCropper
            file={cropQueue[0]}
            onCancel={handleCropCancel}
            onComplete={handleCropComplete}
          />
        </div>
      )}
    </div>
  );
}
