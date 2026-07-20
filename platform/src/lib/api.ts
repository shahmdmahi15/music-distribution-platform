import { env } from "@/env";
import axios from "axios";

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": env.API_KEY,
  },
  validateStatus: function (status) {
    // Resolve the promise if the status code is less than 500
    // This means 2xx, 400, 401, 404, etc. will NOT throw an error anymore
    return status < 500;
  },
});
