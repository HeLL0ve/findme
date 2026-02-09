import axios from "axios";
import { config } from "../shared/config";

export default axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});