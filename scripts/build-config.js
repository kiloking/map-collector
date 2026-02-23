#!/usr/bin/env node
/**
 * 建置 config.json - 從環境變數注入敏感資訊
 * 部署時：Cloudflare Pages 會設定 GOOGLE_MAPS_API_KEY
 * 本地開發：執行 GOOGLE_MAPS_API_KEY=你的key node scripts/build-config.js
 */
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '../config.template.json');
const outputPath = path.join(__dirname, '../config.json');

const config = JSON.parse(fs.readFileSync(templatePath, 'utf8'));

// 從環境變數讀取，若無則保留 template 中的值
config.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || config.googleMapsApiKey || '';
config.googleScriptUrl = process.env.GOOGLE_SCRIPT_URL || config.googleScriptUrl || '';

if (!config.googleMapsApiKey) {
  console.warn('⚠️  GOOGLE_MAPS_API_KEY 未設定，地圖可能無法載入');
}

fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
console.log('✓ config.json 已產生');
