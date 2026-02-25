import { app, BrowserWindow } from "electron";
import * as path from "path";
import * as http from "http";
import { registerIpc } from "../src/ipc/register";

function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  const urlObj = new URL(url);
  let attempt = 0;

  return new Promise((resolve) => {
    const tryConnect = () => {
      attempt++;
      const req = http.get(
        { hostname: urlObj.hostname, port: urlObj.port, path: urlObj.pathname },
        (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) {
            resolve(true);
          } else if (attempt < maxAttempts) {
            setTimeout(tryConnect, 1000);
          } else {
            resolve(false);
          }
        }
      );
      req.on("error", () => {
        if (attempt < maxAttempts) {
          setTimeout(tryConnect, 1000);
        } else {
          resolve(false);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
        if (attempt < maxAttempts) {
          setTimeout(tryConnect, 1000);
        } else {
          resolve(false);
        }
      });
    };
    tryConnect();
  });
}

function createWindow() {
  const isDev = !app.isPackaged;

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#1a1a2e",
    ...(process.platform !== "darwin" && { titleBarOverlay: true }),
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5175";
    waitForServer(devServerUrl).then((isReady) => {
      if (isReady) {
        win.loadURL(devServerUrl);
      } else {
        win.loadURL(
          `data:text/html,<h1>Dev server failed to start</h1><p>Please check that the Vite dev server is running</p>`
        );
      }
    });
  } else {
    const indexPath = path.join(__dirname, "index.html");
    win.loadFile(indexPath);
  }

  win.setTitle("Claude Conversations");
  return win;
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  registerIpc();
  createWindow();
});
