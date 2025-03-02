import { Router } from "express";
import { followUser, unfollowUser, getFollowStatus } from '../controllers/followController.js';

const router = Router()

// Ruta para seguir a un usuario
router.post('/follow', followUser);

// Ruta para dejar de seguir a un usuario
router.post('/unfollow', unfollowUser);

router.get('/status/:follower/:followed', getFollowStatus);


export default router;