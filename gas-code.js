/**
 * Google Apps Script - 地圖資料收集接收器
 *
 * 支援操作：
 *   GET  → 回傳所有已收集的資料（JSON 格式，支援 JSONP）
 *   POST → 新增 / 更新 / 刪除資料
 *
 * 使用方式：
 * 1. 開啟你的 Google Sheet
 * 2. 點選「擴充功能」>「Apps Script」
 * 3. 刪除預設程式碼，貼上這整份程式碼
 * 4. 點選「部署」>「新增部署作業」
 * 5. 類型選「網頁應用程式」
 * 6. 執行身分：「我」
 * 7. 存取權：「所有人」
 * 8. 點選「部署」，複製產生的 URL
 * 9. 將 URL 貼到 config.json 的 googleScriptUrl 欄位
 *
 * 注意：每次修改程式碼後都需要「新增部署作業」才會生效
 */

// ====== 設定 ======

const SHEET_NAME = '';

// 欄位定義（順序 = Google Sheet 的欄位順序）
const COLUMNS = [
  'id',            // 唯一識別碼（自動產生）
  'lat',           // 緯度
  'lng',           // 經度
  'shopName',      // 店名
  'address',       // 地址
  'category',      // 類別
  'accessibility', // 無障礙設施
  'rating',        // 評分（1-5）
  'experience',    // 體驗心得
  'reporter',      // 回報者
  'timestamp'      // 提交時間（自動產生）
];

const COLUMN_LABELS = {
  'id': 'ID',
  'lat': '緯度',
  'lng': '經度',
  'shopName': '店名',
  'address': '地址',
  'category': '類別',
  'accessibility': '無障礙設施',
  'rating': '評分',
  'experience': '體驗心得',
  'reporter': '回報者',
  'timestamp': '提交時間'
};

// ====== GET：回傳所有資料（支援 JSONP）======

function doGet(e) {
  try {
    var sheet = getSheet();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    var result;

    if (lastRow <= 1 || lastCol === 0) {
      result = { success: true, data: [] };
    } else {
      var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
      var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
      var rows = dataRange.getValues();

      var data = rows.map(function (row) {
        var obj = {};
        headers.forEach(function (header, i) {
          var key = findKeyByLabel(header) || header;
          obj[key] = row[i] !== undefined && row[i] !== null ? String(row[i]) : '';
        });
        return obj;
      });

      result = { success: true, data: data };
    }

    var callback = e.parameter.callback;
    if (callback) {
      var output = ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')');
      output.setMimeType(ContentService.MimeType.JAVASCRIPT);
      return output;
    }

    return createJsonResponse(result);

  } catch (err) {
    var errorResult = { success: false, message: err.message };
    var cb = e.parameter.callback;
    if (cb) {
      var out = ContentService.createTextOutput(cb + '(' + JSON.stringify(errorResult) + ')');
      out.setMimeType(ContentService.MimeType.JAVASCRIPT);
      return out;
    }
    return createJsonResponse(errorResult);
  }
}

// ====== POST：新增 / 更新 / 刪除 ======

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data._action || 'create';

    if (action === 'update') {
      return handleUpdate(data);
    } else if (action === 'delete') {
      return handleDelete(data);
    } else {
      return handleCreate(data);
    }

  } catch (err) {
    return createJsonResponse({ success: false, message: err.message });
  }
}

// ====== 新增 ======

function handleCreate(data) {
  var sheet = getSheet();

  // 如果是空表格，先建立標題列
  if (sheet.getLastColumn() === 0) {
    var headerLabels = COLUMNS.map(function (col) {
      return COLUMN_LABELS[col] || col;
    });
    sheet.getRange(1, 1, 1, headerLabels.length).setValues([headerLabels]);

    var headerRange = sheet.getRange(1, 1, 1, headerLabels.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a73e8');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // 產生唯一 ID
  var id = data.id || generateId();

  var row = COLUMNS.map(function (col) {
    if (col === 'id') return id;
    if (col === 'timestamp') {
      return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
    }
    return data[col] || '';
  });

  sheet.appendRow(row);

  return createJsonResponse({ success: true, message: '資料已成功寫入', id: id });
}

// ====== 更新 ======

function handleUpdate(data) {
  var sheet = getSheet();
  var id = data.id;
  if (!id) return createJsonResponse({ success: false, message: '缺少 ID' });

  var rowIndex = findRowById(sheet, id);
  if (rowIndex === -1) {
    return createJsonResponse({ success: false, message: '找不到此筆資料' });
  }

  // 讀取現有標題
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  // 更新該列的值
  var rowData = [];
  for (var i = 0; i < headers.length; i++) {
    var key = findKeyByLabel(headers[i]) || headers[i];
    if (key === 'id') {
      rowData.push(id);
    } else if (key === 'timestamp') {
      // 保留原本的 timestamp，加上更新時間備註
      var original = sheet.getRange(rowIndex, i + 1).getValue();
      rowData.push(original);
    } else if (data[key] !== undefined) {
      rowData.push(data[key]);
    } else {
      rowData.push(sheet.getRange(rowIndex, i + 1).getValue());
    }
  }

  sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);

  return createJsonResponse({ success: true, message: '資料已更新' });
}

// ====== 刪除 ======

function handleDelete(data) {
  var sheet = getSheet();
  var id = data.id;
  if (!id) return createJsonResponse({ success: false, message: '缺少 ID' });

  var rowIndex = findRowById(sheet, id);
  if (rowIndex === -1) {
    return createJsonResponse({ success: false, message: '找不到此筆資料' });
  }

  sheet.deleteRow(rowIndex);

  return createJsonResponse({ success: true, message: '資料已刪除' });
}

// ====== 輔助函式 ======

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (SHEET_NAME) {
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('找不到工作表：' + SHEET_NAME);
    return sheet;
  }
  return ss.getSheets()[0];
}

function findKeyByLabel(label) {
  for (var key in COLUMN_LABELS) {
    if (COLUMN_LABELS[key] === label) return key;
  }
  return null;
}

function findRowById(sheet, id) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return -1;

  // 找到 ID 欄的位置
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var idColIndex = -1;
  for (var i = 0; i < headers.length; i++) {
    var key = findKeyByLabel(headers[i]) || headers[i];
    if (key === 'id') {
      idColIndex = i + 1;
      break;
    }
  }
  if (idColIndex === -1) return -1;

  // 搜尋 ID
  var idValues = sheet.getRange(2, idColIndex, lastRow - 1, 1).getValues();
  for (var j = 0; j < idValues.length; j++) {
    if (String(idValues[j][0]) === String(id)) {
      return j + 2; // +2 因為跳過標題列且從 1 開始
    }
  }
  return -1;
}

function generateId() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss') +
    '_' + Math.random().toString(36).substr(2, 6);
}

function createJsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
