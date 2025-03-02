import { Router } from "express";
import {
  createOrder,
  receiveWebhook,
} from "../controllers/payment.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-order", auth, createOrder);

router.post("/webhook", receiveWebhook);

router.get("/failure", (req, res) => res.send("Pago fallido"));
router.get("/pending", (req, res) => res.send("Pago pendiente"));

// Endpoint de éxito: redirige al perfil del vendedor
router.get("/success", (req, res) => {
  const sellerUsername = req.query.seller || "defaultSeller";
  // Aquí rediriges al perfil del vendedor (ajusta la URL según tu frontend)
  res.redirect(`https://localhost:3000/${sellerUsername}`);
});



export default router;