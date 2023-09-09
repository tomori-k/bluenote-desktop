import { app, BrowserWindow } from 'electron'

const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600
  })

  window.loadURL('http://localhost:5173')
}

app.whenReady().then(() => {
  createWindow()
})