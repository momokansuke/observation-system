# 観察記録システム デスクトップアプリ

Electron製のデスクトップアプリです。Vercelにデプロイしたウェブアプリをデスクトップアプリとして利用できます。

## セットアップ

### 1. 依存パッケージをインストール

```bash
cd desktop
npm install
```

### 2. 本番URLを設定

`main.js` の以下の行を、デプロイしたVercelのURLに変更してください：

```js
appUrl: 'https://your-app.vercel.app',  // ← ここをVercelのURLに変更
```

### 3. 開発環境で起動テスト

```bash
npm start
```

### 4. Windowsインストーラーをビルド

```bash
npm run build
```

`dist/` フォルダに `.exe` インストーラーが生成されます。

## アイコンについて

- Windows: `icon.ico` をdesktopフォルダに配置してください
- Mac: `icon.icns` をdesktopフォルダに配置してください

アイコンがない場合はデフォルトのElectronアイコンが使用されます。

## 配布方法

`dist/観察記録システム Setup x.x.x.exe` を配布するだけです。
受け取ったユーザーはダブルクリックでインストールできます。
