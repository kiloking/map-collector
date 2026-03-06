# 部署說明

## 環境變數

| 變數名稱 | 說明 | 必填 |
|----------|------|------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API 金鑰 | ✓ |
| `GOOGLE_SCRIPT_URL` | Google Apps Script 網址（選填） | |

---

## 本地開發

```bash
GOOGLE_MAPS_API_KEY=你的API金鑰 npm run build
```

---

## Cloudflare Workers & Pages 部署

整合後的平台使用 `wrangler` 部署靜態資源。

### 方法一：Git 連線（推薦）

1. **Workers & Pages** → **Create** → **Connect to Git** → 選擇 `map-collector`
2. **Deploy command**（或 Build command）設為：
   ```
   npm install && npm run build && npx wrangler deploy
   ```
   ⚠️ 必須包含 `npm run build`，否則 `dist/` 不會產生，部署會失敗
3. **Environment variables**：新增 `GOOGLE_MAPS_API_KEY`

### 方法二：本機指令部署

```bash
# 1. 安裝依賴（首次）
npm install

# 2. 登入 Cloudflare
npx wrangler login

# 3. 建置並部署
GOOGLE_MAPS_API_KEY=你的金鑰 npm run deploy
```

### 方法三：GitHub Actions 自動部署

在 repo 設定 `GOOGLE_MAPS_API_KEY` 為 GitHub Secret，建立 `.github/workflows/deploy.yml` 於 push 時自動執行 `npm run deploy`。

---

## 檔案說明

- `wrangler.toml`：Cloudflare 設定，指定 `dist/` 為靜態資源目錄
- `config.template.json`：可提交，不含 API Key
- `config.json`、`dist/`：已加入 `.gitignore`
