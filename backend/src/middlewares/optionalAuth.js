// middlewares/optionalAuth.js
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { User } from "../models/user.model.js";

export const optionalAuth = async (req, res, next) => {
  try {
    // Leer la cookie 'token'
    const { token } = req.cookies;
    if (!token) {
      // No hay token → usuario anónimo
      req.user = null;
      return next();
    }

    // Verificar el token
    const decoded = jwt.verify(token, TOKEN_SECRET);
    // Buscar el usuario en la BD (opcional, si quieres “bloqueos” más avanzados)
    const user = await User.findById(decoded.id);
    if (!user) {
      // Token inválido → ignoramos user
      req.user = null;
      return next();
    }

    // Asignar el usuario a req.user
    req.user = user; 
  } catch (error) {
    // Token dañado o expirado → ignoramos user
    req.user = null;
  }
  next();
};
