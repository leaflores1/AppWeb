import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";

export default function BlockedSettingsPage() {
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Cargar la lista de usuarios bloqueados
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/block/blocked`, {
          withCredentials: true,
        });
        setBlockedUsers(response.data);
      } catch (error) {
        console.error("Error al cargar la lista de bloqueados:", error);
      }
    };

    fetchBlockedUsers();
  }, []);

  // Manejar desbloqueo de usuarios
  const handleUnblockUser = async (userId) => {
    try {
      await axios.post(
        `${API_URL}/api/block/unblock`,
        { userId },
        { withCredentials: true }
      );
      setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
    } catch (error) {
      console.error("Error al desbloquear usuario:", error);
    }
  };

  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-black text-2xl font-bold mb-4">Usuarios Bloqueados</h2>
      {blockedUsers.length === 0 ? (
        <p className="text-gray-600">No tienes usuarios bloqueados.</p>
      ) : (
        <ul className="space-y-2">
          {blockedUsers.map((user) => (
            <li key={user._id} className="text-black flex justify-between items-center p-2 border rounded">
              <span>{user.username}</span>
              <button
                onClick={() => handleUnblockUser(user._id)}
                className="bg-red-500 text-white px-3 py-1 rounded"
              >
                Desbloquear
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
