import { io } from "socket.io-client";
import { API_URL } from "./config";

const socket = io(API_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

export default socket;
