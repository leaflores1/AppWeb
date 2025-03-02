// src/pages/subpages/PaymentsPage.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../config";

export default function PaymentsPage() {
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Ajusta el endpoint para que retorne tanto compras como ventas
      // Ej: { purchases: [...], sales: [...] }
      const res = await axios.get(`${API_URL}/api/payments/history`, {
        withCredentials: true,
      });
      setPurchases(res.data.purchases || []);
      setSales(res.data.sales || []);
    } catch (error) {
      console.error("Error al obtener historial de pagos:", error);
    }
  };

  const handleMpConnect = () => {
    // Redirigir a la vinculación de Mercado Pago
    window.location.href = `${API_URL}/api/mp/connect`;
  };

  return (
    <div className="bg-white shadow p-6 rounded max-w-3xl mx-auto text-black">
      <h2 className="text-2xl font-bold mb-6">Pagos</h2>

      {/* Botón Vincular MP */}
      <button
        onClick={handleMpConnect}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-8"
      >
        Vincular Mercado Pago
      </button>

      {/* Historial de Compras */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Historial de Compras</h3>
        {purchases.length === 0 ? (
          <p className="text-gray-600">No has comprado nada todavía.</p>
        ) : (
          <ul className="space-y-2">
            {purchases.map((purchase, idx) => (
              <li
                key={idx}
                className="border p-2 rounded flex flex-col sm:flex-row justify-between"
              >
                <span>
                  Compraste <span className="font-semibold">{purchase.itemName}</span> de{" "}
                  <span className="font-semibold">{purchase.sellerUsername}</span>{" "}
                  por <span className="font-bold">${purchase.amount}</span>
                </span>
                <span className="text-sm text-gray-500">{purchase.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Historial de Ventas */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Historial de Ventas</h3>
        {sales.length === 0 ? (
          <p className="text-gray-600">No tienes ventas registradas aún.</p>
        ) : (
          <ul className="space-y-2">
            {sales.map((sale, idx) => (
              <li
                key={idx}
                className="border p-2 rounded flex flex-col sm:flex-row justify-between"
              >
                <span>
                  <span className="font-semibold">{sale.buyerUsername}</span> compró tu{" "}
                  <span className="font-semibold">{sale.itemName}</span> por{" "}
                  <span className="font-bold">${sale.amount}</span>
                </span>
                <span className="text-sm text-gray-500">{sale.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
