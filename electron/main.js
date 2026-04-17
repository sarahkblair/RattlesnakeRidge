const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

const SERVER_PORT = 3001;
const isDev = process.env.NODE_ENV === 'development';

function startServer() {
  const serverPath = path.join(__dirname, '..', 'server', 'index.js');
  serverProcess = fork(serverPath, [], {
    env: { ...process.env, PORT: SERVER_PORT },
    silent: true
  });

  serverProcess.stdout.on('data', (data) => console.log('[server]', data.toString()));
  serverProcess.stderr.on('data', (data) => console.error('[server]', data.toString()));

  serverProcess.on('error', (err) => console.error('Server error:', err));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#e8f0e2',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  // Wait for server to start
  setTimeout(() => {
    const url = `http://localhost:${SERVER_PORT}`;
    mainWindow.loadURL(url);
    mainWindow.once('ready-to-show', () => mainWindow.show());
  }, 1500);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startServer();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});

// IPC: open external URL
ipcMain.on('open-external', (_, url) => {
  shell.openExternal(url);
});
