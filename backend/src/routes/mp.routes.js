// routes/mp.routes.js
import { Router } from "express";
import Seller from "../models/seller.model.js";
import { auth } from "../middlewares/auth.middleware.js";
import {
  connectSeller,
  handleCallback,
  createPreference
} from "../controllers/mp.controller.js";

const router = Router();

// Redirige al vendedor a OAuth
router.get("/connect/:sellerId",connectSeller);

// Callback de OAuth
router.get("/callback", handleCallback);

// Crear preferencia
router.post("/create_preference/:sellerId", createPreference);

// (Opcional) Rutas de prueba success/failure
router.get("/success", (req, res) => res.send("Pago completado (success)"));
router.get("/failure", (req, res) => res.send("Pago fallido (failure)"));

router.get("/check_seller", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ isLinked: false });
    }

    // Verificar si el usuario está guardado en Seller.model
    const seller = await Seller.findOne({ sellerId: req.user.username });

    res.json({ isLinked: !!seller }); // Retorna true si el vendedor está guardado, false si no
  } catch (error) {
    console.error("Error al verificar vendedor:", error);
    res.status(500).json({ isLinked: false });
  }
});

router.get("/get_currency", auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "No autenticado" });
    }

    const seller = await Seller.findOne({ sellerId: req.user.username });

    if (!seller || !seller.site_id) {
      return res.status(404).json({ message: "Vendedor no vinculado a Mercado Pago" });
    }

    const currencyMapping = {
      "MLA": "ARS", // Argentina
      "MLB": "BRL", // Brasil
      "MLC": "CLP", // Chile
      "MCO": "COP", // Colombia
      "MLM": "MXN", // México
      "MPE": "PEN", // Perú
      "MLU": "UYU", // Uruguay
    };

    const currency = currencyMapping[seller.site_id] || "ARS"; // Si no está en la lista, por defecto ARS

    res.json({ currency });
  } catch (error) {
    console.error("Error al obtener la moneda:", error);
    res.status(500).json({ message: "Error interno" });
  }
});



export default router;
