import { Router } from "express";
import { User } from "../models/user.model.js";
import { auth } from "../middlewares/auth.middleware.js";
import { Report } from "../models/report.model.js";
import { Follow } from "../models/follow.model.js";


const router = Router();

// Bloquear usuario /api/block/block
router.post("/block", auth, async (req, res) => {
    try {
      // 1. Cargamos el usuario actual con todo el documento
      const currentUser = await User.findById(req.user.id);
      if (!currentUser) {
        return res.status(401).json({ error: "Usuario autenticado no encontrado" });
      }
  
      const { userId } = req.body;
  
      // Evitar que bloquee a sí mismo
      if (currentUser._id.toString() === userId) {
        return res.status(400).json({ error: "No puedes bloquearte a ti mismo" });
      }
  
      // 2. Usuario a bloquear
      const userToBlock = await User.findById(userId);
      if (!userToBlock) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }
  
      // 3. Checar si ya está bloqueado
      if (currentUser.blockedUsers.includes(userId)) {
        return res.status(400).json({ error: "El usuario ya está bloqueado" });
      }
  
      // 4. Añadir a blockedUsers
      currentUser.blockedUsers.push(userId);
  
      // 5. Eliminar la relación (followers/following) en ambos
      currentUser.following = currentUser.following.filter(
        (f) => f.toString() !== userId
      );
      currentUser.followers = currentUser.followers.filter(
        (f) => f.toString() !== userId
      );
  
      userToBlock.following = userToBlock.following.filter(
        (f) => f.toString() !== currentUser._id.toString()
      );
      userToBlock.followers = userToBlock.followers.filter(
        (f) => f.toString() !== currentUser._id.toString()
      );
  
      // 6. Guardar cambios en paralelo
      await Promise.all([currentUser.save(), userToBlock.save()]);
  
      // 7. Borrar en la colección Follow
      //    A. Tal vez usas .toLowerCase() si es que guardaste en minúsculas
      const currentUname = currentUser.username; // as it is
      const blockedUname = userToBlock.username;
  
      // Eliminamos tanto (current -> blocked) como (blocked -> current)
      // Si guardas "Test1" y "test1" en la DB con mayúsculas distintas, ajusta tu lógica (toLowerCase).
      await Follow.deleteMany({
        $or: [
          {
            followerUsername: currentUname,
            followedUsername: blockedUname,
          },
          {
            followerUsername: blockedUname,
            followedUsername: currentUname,
          },
        ],
      });
  
      return res.status(200).json({ message: "Usuario bloqueado exitosamente" });
    } catch (error) {
      console.error("Error al bloquear usuario:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  });
  
  // Desbloquear usuario
  router.post('/unblock', auth, async (req, res) => {
    try {
      const currentUser = req.user;
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'El ID del usuario es requerido' });
      }
  
      // Verificar que el usuario esté bloqueado
      const blockedIndex = currentUser.blockedUsers.indexOf(userId);
      if (blockedIndex === -1) {
        return res.status(400).json({ error: 'El usuario no está bloqueado' });
      }
  
      // Eliminar al usuario de la lista de bloqueados
      currentUser.blockedUsers.splice(blockedIndex, 1);
      await currentUser.save();
      res.status(200).json({ message: 'Usuario desbloqueado exitosamente' });
    } catch (error) {
      console.error('Error al desbloquear usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Obtener lista de usuarios bloqueados
  router.get('/blocked', auth, async (req, res) => {
    try {
      const currentUser = req.user;
      const blockedUsers = await User.find({ _id: { $in: currentUser.blockedUsers } }).select('username');
      res.status(200).json(blockedUsers);
    } catch (error) {
      console.error('Error al obtener usuarios bloqueados:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  export default router;