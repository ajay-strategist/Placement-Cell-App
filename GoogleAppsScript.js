// Google Apps Script Database Backend for Christ Placement Cell App
// Copy this entire code into your Google Apps Script editor.
// Deploy as a Web App: 
// 1. Click "Deploy" -> "New deployment"
// 2. Select type: "Web app"
// 3. Set Execute as: "Me"
// 4. Set Who has access: "Anyone"
// 5. Deploy, authorize permissions, and copy the Web App URL.
// 6. Paste the URL into js/db.js under `this.apiUrl`.

function doGet(e) {
  var action = e.parameter.action;
  
  if (action === 'readAll') {
    var data = {};
    data["Students"] = readSheetAsObjects("Students");
    data["Teacher"] = readSheetAsObjects("Teacher");
    data["Training Program"] = readSheetAsObjects("Training Program");
    data["Activity"] = readSheetAsObjects("Activity");
    data["Exams"] = readSheetAsObjects("Exams");
    data["ClassIncharge"] = readSheetAsObjects("ClassIncharge");
    
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action' }))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*');
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var sheetName = requestData.sheet;
    
    if (action === 'save') {
      saveData(sheetName, requestData.data);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data saved successfully' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    
    if (action === 'delete') {
      deleteData(sheetName, requestData.id);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Data deleted successfully' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*');
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid POST action' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

function getPrimaryKeyHeader(sheetName) {
  if (sheetName === 'Students') return 'registerNumber';
  if (sheetName === 'Teacher') return 'phoneNumber';
  if (sheetName === 'ClassIncharge') return 'className';
  return 'id'; // Default for Training Program, Activity, Exams
}

function readSheetAsObjects(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var objects = [];
  for (var i = 1; i < values.length; i++) {
    var obj = {};
    var row = values[i];
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      // Convert boolean-like strings
      if (val === 'true') val = true;
      if (val === 'false') val = false;
      obj[headers[j]] = val;
    }
    objects.push(obj);
  }
  return objects;
}

function saveData(sheetName, data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  var items = Array.isArray(data) ? data : [data];
  if (items.length === 0) return;
  
  // Read existing headers
  var headers = [];
  if (sheet.getLastRow() > 0) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  
  var keyCol = getPrimaryKeyHeader(sheetName);
  
  items.forEach(function(item) {
    // 1. Ensure all keys in item exist as headers in sheet
    var itemKeys = Object.keys(item);
    var headersChanged = false;
    itemKeys.forEach(function(key) {
      if (headers.indexOf(key) === -1) {
        headers.push(key);
        headersChanged = true;
      }
    });
    if (headersChanged) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
    
    // 2. Search for existing row with primary key
    var keyIndex = headers.indexOf(keyCol);
    var keyValue = item[keyCol];
    var rowIndex = -1;
    
    if (sheet.getLastRow() > 1 && keyIndex !== -1) {
      var values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < values.length; i++) {
        if (String(values[i][0]) === String(keyValue)) {
          rowIndex = i + 2; // Row index is 2-indexed (i=0 is row 2)
          break;
        }
      }
    }
    
    // 3. Map item values to columns
    var rowValues = [];
    headers.forEach(function(header) {
      var val = item[header];
      if (typeof val === 'object' && val !== null) {
        rowValues.push(JSON.stringify(val));
      } else {
        rowValues.push(val === undefined ? "" : val);
      }
    });
    
    if (rowIndex !== -1) {
      // Update existing
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues([rowValues]);
    } else {
      // Append new
      sheet.appendRow(rowValues);
    }
  });
}

function deleteData(sheetName, id) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return;
  
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyCol = getPrimaryKeyHeader(sheetName);
  var keyIndex = headers.indexOf(keyCol);
  if (keyIndex === -1) return;
  
  var values = sheet.getRange(2, keyIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  for (var i = values.length - 1; i >= 0; i--) {
    if (String(values[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
    }
  }
}
