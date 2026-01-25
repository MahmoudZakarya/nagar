import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { spawn } from "child_process";
import fs from "fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#854836",
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  // PDF Generation Handler
  ipcMain.handle("save-pdf", async (event) => {
    const webContents = event.sender;
    const window = BrowserWindow.fromWebContents(webContents);

    if (!window) return { success: false, error: "Window not found" };

    try {
      // Show save dialog
      const { filePath, canceled } = await dialog.showSaveDialog(window, {
        title: "حفظ عرض السعر كـ PDF",
        defaultPath: path.join(app.getPath("documents"), "Quotation.pdf"),
        filters: [{ name: "PDF Files", extensions: ["pdf"] }],
      });

      if (canceled || !filePath) return { success: false };

      // Generate PDF
      const pdfData = await webContents.printToPDF({
        printBackground: true,
        margins: {
          marginType: "none",
        },
        pageSize: "A4",
        landscape: false,
      });

      // Save to file
      fs.writeFileSync(filePath, pdfData);

      return { success: true, filePath };
    } catch (error: any) {
      console.error("PDF generation error:", error);
      return { success: false, error: error.message };
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});
