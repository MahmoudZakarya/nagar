const isElectron =
  typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent);

const API_URL =
  import.meta.env.VITE_API_URL ||
  (isElectron || import.meta.env.DEV ? "http://localhost:3000" : "");

export default API_URL;
