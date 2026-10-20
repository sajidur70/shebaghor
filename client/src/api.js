import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Turns any Axios error into a human-readable message.
export function errorMessage(err) {
  return err.response?.data?.error || err.message || "Something went wrong";
}
