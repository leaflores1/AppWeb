import axios from "axios";
import { API_URL } from "../config";

export const handleReport = async (itemId, itemType, reason, onSuccess, onError) => {
  try {
    await axios.post(`${API_URL}/api/report`, 
      { itemId,
         itemType, 
         reason },
       { withCredentials: true });
    alert("Reporte enviado. Gracias por ayudar a moderar.");
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Error al reportar:", error);
    if (onError) onError(error);
  }
};
