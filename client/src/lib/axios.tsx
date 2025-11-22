// src/lib/axios.ts
import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || '', // Use relative URLs when proxied, fallback to env var for dev
  withCredentials: true, // This will send the cookie with every request 
});

export default instance;
