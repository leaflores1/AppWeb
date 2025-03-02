// auth.middleware.js
import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config.js";
import { User } from "../models/user.model.js";

export const auth = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, TOKEN_SECRET);
    // Busca al usuario en la BD, obteniendo documento completo (incl. _id)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    req.user = user;  // Asignamos el doc de Mongoose
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};
