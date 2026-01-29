import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { spawn, fork } from "child_process";
import fs from "fs";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let serverProcess: any = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function startBackend() {
  const userDataPath = app.getPath("userData");
  const logPath = path.join(userDataPath, "logs.txt");
  const logStream = fs.createWriteStream(logPath, { flags: "a" });

  // In development, __dirname is dist-electron. server/index.ts is in ../server/
  // In production, __dirname is dist-electron. dist-server/index.js is in ../dist-server/
  const finalPath = isDev
    ? path.join(__dirname, "..", "server", "index.ts")
    : path.join(__dirname, "..", "dist-server", "index.js");

  const execArgv = isDev ? ["-r", "ts-node/register"] : [];

  const logHeader = `\n[${new Date().toISOString()}] Starting backend (Mode: ${isDev ? "Development" : "Production"})\nPath: ${finalPath}\nDataDir: ${userDataPath}\n`;
  logStream.write(logHeader);
  console.log(logHeader);

  serverProcess = fork(finalPath, [], {
    env: {
      ...process.env,
      NODE_ENV: isDev ? "development" : "production",
      PORT: "3000",
      DATA_DIR: userDataPath,
      TS_NODE_PROJECT: isDev
        ? path.join(__dirname, "..", "tsconfig.server.json")
        : undefined,
    },
    execArgv,
    stdio: ["ignore", "pipe", "pipe", "ipc"],
  });

  serverProcess.stdout.pipe(logStream);
  serverProcess.stderr.pipe(logStream);

  // Also pipe to main process console for better dev debugging
  if (isDev) {
    serverProcess.stdout.on("data", (data: any) =>
      console.log(`[Backend] ${data}`),
    );
    serverProcess.stderr.on("data", (data: any) =>
      console.error(`[Backend ERROR] ${data}`),
    );
  }

  serverProcess.on("error", (err: any) => {
    const errMsg = `[ERROR] Failed to start backend: ${err.message}\n`;
    logStream.write(errMsg);
    console.error(errMsg);
  });

  serverProcess.on("exit", (code: any, signal: any) => {
    const exitMsg = `[EXIT] Backend exited with code ${code} and signal ${signal}\n`;
    logStream.write(exitMsg);
    console.log(exitMsg);
  });
}

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
  startBackend();
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
