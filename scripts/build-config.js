#!/usr/bin/env node
/**
 * 建置 dist/ - 從環境變數注入敏感資訊，輸出部署用檔案
 * 部署時：Cloudflare 會設定 GOOGLE_MAPS_API_KEY
 * 本地開發：GOOGLE_MAPS_API_KEY=你的key node scripts/build-config.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const distDir = path.join(root, 'dist');

// 確保 dist 目錄存在
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

// 產生 config.json
const config = JSON.parse(fs.readFileSync(path.join(root, 'config.template.json'), 'utf8'));
config.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || config.googleMapsApiKey || '';
config.googleScriptUrl = process.env.GOOGLE_SCRIPT_URL || config.googleScriptUrl || '';

if (!config.googleMapsApiKey) {
  console.warn('⚠️  GOOGLE_MAPS_API_KEY 未設定，地圖可能無法載入');
}

fs.writeFileSync(path.join(distDir, 'config.json'), JSON.stringify(config, null, 2));

// 複製靜態檔案
['index.html', 'gas-code.js'].forEach(function (f) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, f));
  }
});

// 同時保留根目錄 config.json 供本地開發
fs.writeFileSync(path.join(root, 'config.json'), JSON.stringify(config, null, 2));

console.log('✓ dist/ 已建置完成');
