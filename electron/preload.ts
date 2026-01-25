import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  savePDF: () => ipcRenderer.invoke("save-pdf"),
});
