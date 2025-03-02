import crypto from "crypto";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { sendMail } from "../utils/mail.js"; // tu función para enviar correos

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad, puedes retornar 200 diciendo "Correo enviado", 
      // aun si no existe el user, para no filtrar info.
      return res.status(404).json({ message: "No existe usuario con ese email" });
    }

    // Generar token (random)
    const token = crypto.randomBytes(20).toString("hex");

    // Guardar token y fecha de expiración en el user
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 30; // 30 min
    await user.save();

    // Enviar correo con link:
    const resetLink = `https://localhost:3000/reset-password?token=${token}`;
    // O tu dominio en producción, etc.

    const mailOptions = {
      to: user.email,
      subject: "Recuperar contraseña",
      text: `Hola. Para recuperar tu contraseña, haz clic aquí: ${resetLink}`,
    };

    await sendMail(mailOptions);

    return res.status(200).json({ message: "Correo enviado con éxito" });
  } catch (error) {
    console.error("Error en forgotPassword:", error);
    return res.status(500).json({ message: "Error interno" });
  }
};

export const resetPassword = async (req, res) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: "Faltan parámetros" });
      }
  
      // 1. Verificar que coincidan las contraseñas
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: "Las contraseñas no coinciden." });
      }
  
      // 2. (Opcional) verificar la longitud mínima de la contraseña
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres." });
      }
  
      // 3. Buscar usuario con ese token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });
      if (!user) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }
  
      // 4. Actualizar contraseña
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
  
      // 5. Limpiar token
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      return res.status(200).json({ message: "Contraseña actualizada con éxito" });
    } catch (error) {
      console.error("Error en resetPassword:", error);
      return res.status(500).json({ message: "Error interno" });
    }
  };
  
