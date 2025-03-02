import axios from "axios";
import { API_URL } from "../config";

const instance = axios.create({
  baseURL: API_URL, //cambiar a localhost:3000 si no funciona
  withCredentials: true,
});

export default instance;
