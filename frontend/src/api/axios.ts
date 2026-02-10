import axios from "axios";
import { config } from "../shared/config";

export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});