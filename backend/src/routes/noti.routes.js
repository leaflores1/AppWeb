import { Router } from "express";
import {getNotifications, markAsRead } from '../controllers/noti.controller.js';

const router = Router()

router.get("/notifications/:username", getNotifications);

router.put("/notifications/read/:username", markAsRead);


export default router;