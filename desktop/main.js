const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 設定ファイルのパス
const configPath = path.join(app.getPath('userData'), 'config.json');

// デフォルト設定
const defaultConfig = {
  appUrl: 'https://your-app.vercel.app', // デプロイ後にVercelのURLを設定
};

// 設定を読み込む
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
  } catch (e) {
    console.error('設定ファイル読み込みエラー:', e);
  }
  // 初回起動時は設定ファイルを作成
  fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
}

function createWindow() {
  const config = loadConfig();
  const appUrl = config.appUrl || defaultConfig.appUrl;

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: '観察記録システム',
    autoHideMenuBar: true,
    // Windowsタスクバーのアイコン
    icon: path.join(__dirname, 'icon.ico'),
  });

  // メニューバーを非表示（ただしF12でDevToolsは開けます）
  mainWindow.setMenuBarVisibility(false);

  // アプリURLを読み込み
  mainWindow.loadURL(appUrl).catch(() => {
    // URLが読み込めない場合はエラーページを表示
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
      <head><meta charset="UTF-8"><title>接続エラー</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center;
               min-height: 100vh; margin: 0; background: #f3f4f6; }
        .box { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
               max-width: 500px; text-align: center; }
        h1 { color: #ef4444; }
        p { color: #6b7280; }
        code { background: #f1f5f9; padding: 0.2em 0.5em; border-radius: 4px; font-size: 0.9em; }
        button { margin-top: 1rem; padding: 0.75rem 1.5rem; background: #2563eb; color: white;
                 border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem; }
      </style></head>
      <body>
        <div class="box">
          <h1>⚠️ 接続できません</h1>
          <p>サーバーに接続できませんでした。</p>
          <p>設定URL: <code>${appUrl}</code></p>
          <p>インターネット接続を確認してから、再度お試しください。</p>
          <button onclick="window.location.reload()">再読み込み</button>
        </div>
      </body></html>
    `);
  });

  // 外部リンクはデフォルトブラウザで開く
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // タイトルを固定
  mainWindow.webContents.on('page-title-updated', (e) => {
    e.preventDefault();
    mainWindow.setTitle('観察記録システム');
  });

  return mainWindow;
}

// アプリ準備完了
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全ウィンドウを閉じたら終了（macOS以外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
