// src/routes/photos.routes.js
import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import { addCommentToPhoto, getCommentsFromPhoto } from "../controllers/comment.controllers.js";

const router = Router();

// Crear comentario
//      /api/comment/:photoId/comments

router.post("/:photoId/comments", auth, addCommentToPhoto);

// Obtener comentarios de una foto
router.get("/:photoId/comments", getCommentsFromPhoto);



export default router;
