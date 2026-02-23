# 部署說明

## 環境變數

使用環境變數保護敏感資訊，避免將 API Key 提交到 Git。

| 變數名稱 | 說明 | 必填 |
|----------|------|------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API 金鑰 | ✓ |
| `GOOGLE_SCRIPT_URL` | Google Apps Script 網址（選填，預設用 template 中的值） | |

---

## 本地開發

產生 `config.json`：

```bash
GOOGLE_MAPS_API_KEY=你的API金鑰 node scripts/build-config.js
```

或一次設定多個：

```bash
GOOGLE_MAPS_API_KEY=xxx GOOGLE_SCRIPT_URL=yyy node scripts/build-config.js
```

---

## Cloudflare Pages 部署

1. **Settings** → **Environment variables**
2. 新增變數：
   - **Variable name**: `GOOGLE_MAPS_API_KEY`
   - **Value**: 你的 Google Maps API 金鑰
   - **Environment**: Production（及 Preview 若需要）

3. **Build settings**：
   - **Build command**: `node scripts/build-config.js`
   - **Build output directory**: `/`
   - **Root directory**: 留空或 `/`

4. 儲存後重新部署

---

## 注意

- `config.template.json` 可提交到 Git（不含敏感資訊）
- `config.json` 已加入 `.gitignore`，不會被提交
- 部署前請在 Google Cloud Console 為 API Key 設定 HTTP referrer 限制
