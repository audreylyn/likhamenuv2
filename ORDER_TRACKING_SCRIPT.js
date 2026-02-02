/**
 * Google Apps Script for Order Tracking - Unified System
 * 
 * This script handles order submissions from both Website and POS.
 * It separates orders into "Orders Website" and "Orders POS" tabs
 * and provides a unified Dashboard.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to script.google.com
 * 2. Create a new project
 * 3. Paste this entire code
 * 4. Update ADMIN_EMAIL in the CONFIGURATION section
 * 5. Deploy as Web App (Execute as: Me, Who has access: Anyone)
 * 6. Copy the Web App URL and update your website configuration
 */

// ============================================
// 1. CONFIGURATION (Config.gs)
// ============================================
const CONFIG = {
  ADMIN_EMAIL: "likhasiteworks@gmail.com", // Change this to your email
  DRIVE_FOLDER_NAME: "LikhaMenuV2/Order Tracking",
  // Admin notifications - set to true to receive email on new orders
  ADMIN_NOTIFY_NEW_ORDERS: false,
  SHEET_NAMES: {
    ORDERS: "Orders",
    DASHBOARD: "Dashboard"
  },
  ORDER_STATUS_OPTIONS: ["Pending", "Processing", "Preparing", "Ready", "Out for Delivery", "Delivered", "Cancelled"]
};

// ============================================
// 2. API HANDLER (API.gs)
// ============================================
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for lock

  try {
    // Parse the incoming JSON data
    const data = JSON.parse(e.postData.contents);
    
    // Extract order data
    const websiteId = data.websiteId || "unknown";
    const websiteTitle = data.websiteTitle || "Unknown Website";
    const orderData = data.order || {};
    
    // Validate required fields
    if (!orderData.customerName || !orderData.items || !orderData.items.length) {
      throw new Error("Missing required order data: customerName and items are required");
    }

    // Get or create the Drive folder
    const folder = getOrCreateFolder(CONFIG.DRIVE_FOLDER_NAME);
    
    // Get or create spreadsheet for this website
    const spreadsheet = getOrCreateSpreadsheet(folder, websiteId, websiteTitle);
    
    // Get or create the orders sheet
    const ordersSheet = getOrCreateOrdersSheet(spreadsheet, CONFIG.SHEET_NAMES.ORDERS);
    
    // Remove default Sheet1 if it exists
    deleteDefaultSheet(spreadsheet);
    
    // Add the order to the spreadsheet
    addOrderToSheet(ordersSheet, orderData);

    // Send admin notification if enabled
    if (CONFIG.ADMIN_NOTIFY_NEW_ORDERS) {
      sendNewOrderEmail(orderData, websiteTitle);
    }
    
    // Update Dashboard
    createOrUpdateDashboardSheet(spreadsheet, websiteTitle);
    
    return ContentService.createTextOutput(
      JSON.stringify({ 
        result: "success",
        message: "Order saved successfully",
        spreadsheetUrl: spreadsheet.getUrl()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("Error processing order:", error);
    
    // Send error notification email
    try {
      MailApp.sendEmail({
        to: CONFIG.ADMIN_EMAIL,
        subject: "Order Tracking Script Error",
        body: "An error occurred processing an order:\n\n" + error.toString() + "\n\nData: " + JSON.stringify(e.postData.contents)
      });
    } catch (emailError) {
      console.error("Failed to send error email:", emailError);
    }
    
    return ContentService.createTextOutput(
      JSON.stringify({ 
        result: "error", 
        error: error.toString() 
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "3600"
    });
}

// ============================================
// 3. ORDER CONTROLLER (OrderController.gs)
// ============================================

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  
  // Create nested folders if needed
  const parts = folderName.split('/');
  let currentFolder = DriveApp.getRootFolder();
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;
    
    const subFolders = currentFolder.getFoldersByName(part);
    if (subFolders.hasNext()) {
      currentFolder = subFolders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  return currentFolder;
}

function getOrCreateSpreadsheet(folder, websiteId, websiteTitle) {
  const expectedName = websiteTitle + " - Orders";
  const files = folder.getFilesByName(expectedName);
  
  if (files.hasNext()) {
    return SpreadsheetApp.openById(files.next().getId());
  } else {
    const spreadsheet = SpreadsheetApp.create(expectedName);
    const file = DriveApp.getFileById(spreadsheet.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
    return spreadsheet;
  }
}

function getOrCreateOrdersSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    
    // Set up headers
    const headers = [
      "Order ID", "Date/Time", "Customer Name", "Customer Email", 
      "Contact Number", "Order Type", "Location", "Items", "Item Details", 
      "Total Amount", "Note", "Status"
    ];
    
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4285f4");
    headerRange.setFontColor("#ffffff");
    headerRange.setHorizontalAlignment("center");
    
    // Data Validation for Status (Column L now)
    const statusRange = sheet.getRange(2, 12, 1000, 1);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(CONFIG.ORDER_STATUS_OPTIONS, true)
      .setAllowInvalid(false)
      .build();
    statusRange.setDataValidation(rule);
    
    // Column Widths
    sheet.setColumnWidth(1, 180);  // Order ID
    sheet.setColumnWidth(2, 150);  // Date/Time
    sheet.setColumnWidth(3, 150);  // Customer Name
    sheet.setColumnWidth(4, 180);  // Customer Email
    sheet.setColumnWidth(5, 130);  // Contact Number
    sheet.setColumnWidth(6, 100);  // Order Type
    sheet.setColumnWidth(7, 200);  // Location
    sheet.setColumnWidth(8, 300);  // Items
    sheet.setColumnWidth(9, 400);  // Item Details
    sheet.setColumnWidth(10, 120); // Total Amount
    sheet.setColumnWidth(11, 200); // Note
    sheet.setColumnWidth(12, 120); // Status

    // Make Date/Time readable (Column B)
    try {
      sheet.getRange(2, 2, 1000, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");
    } catch (e) {
      console.warn('Unable to set Date/Time format on orders sheet: ' + e.toString());
    }
    
    sheet.setFrozenRows(1);
    setupStatusColorCoding(sheet);
  }
  
  return sheet;
}

function setupStatusColorCoding(sheet) {
  const lastRow = Math.max(sheet.getLastRow(), 20);
  const dataRange = sheet.getRange(2, 1, lastRow, 12);
  
  const rules = [
    { status: "Pending", color: "#ffffff" },
    { status: "Processing", color: "#e3f2fd" },
    { status: "Preparing", color: "#ffe0b2" },
    { status: "Ready", color: "#c8e6c9" },
    { status: "Out for Delivery", color: "#e1bee7" },
    { status: "Delivered", color: "#a5d6a7" },
    { status: "Cancelled", color: "#ffcdd2" }
  ].map(r => SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(`=$L2="${r.status}"`)
    .setBackground(r.color)
    .setRanges([dataRange])
    .build()
  );
  
  sheet.setConditionalFormatRules(rules);
}

function addOrderToSheet(sheet, orderData) {
  const orderId = "ORD-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);
  const now = new Date();
  
  const itemsList = orderData.items.map(item => `${item.name} x${item.quantity}`).join("\n");
  
  const itemDetails = orderData.items.map(item => {
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const subtotal = unitPrice * item.quantity;
    return `${item.name}\n  Qty: ${item.quantity} | Unit: ₱${unitPrice.toFixed(2)} | Sub: ₱${subtotal.toFixed(2)}`;
  }).join("\n\n");
  
  const rowData = [
    orderId,
    now,
    orderData.customerName || "",
    orderData.email || "",
    orderData.contactNumber || "",
    orderData.orderType || "",
    orderData.location || "",
    itemsList,
    itemDetails,
    orderData.totalFormatted || ("₱" + (orderData.total || 0).toFixed(2)),
    orderData.note || "",
    "Pending" // Default Status
  ];
  
  sheet.insertRowBefore(2);
  sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);

  // Ensure Date/Time stays readable for the new row
  try {
    sheet.getRange(2, 2).setNumberFormat("yyyy-mm-dd hh:mm:ss");
  } catch (e) {
    // ignore
  }
  
  // Re-apply validation to new row (Status is now column L = 12)
  const statusCell = sheet.getRange(2, 12);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.ORDER_STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .build();
  statusCell.setDataValidation(rule);
}

function deleteDefaultSheet(spreadsheet) {
  const sheet1 = spreadsheet.getSheetByName("Sheet1");
  if (sheet1 && spreadsheet.getSheets().length > 1) {
    try {
      spreadsheet.deleteSheet(sheet1);
    } catch (e) {
      console.warn("Could not delete Sheet1: " + e.toString());
    }
  }
}

function sendNewOrderEmail(orderData, websiteTitle) {
  try {
    const subject = `🛒 New Order: ${websiteTitle}`;
    const body = `
New Order Received!

Website: ${websiteTitle}
Customer: ${orderData.customerName}
Email: ${orderData.email || "N/A"}
Location: ${orderData.location || "N/A"}
Total: ${orderData.totalFormatted || orderData.total}

Items:
${orderData.items.map(i => `- ${i.name} x${i.quantity}`).join("\n")}

Note: ${orderData.note || "None"}

Please check the spreadsheet for full details.
    `;
    
    MailApp.sendEmail({
      to: CONFIG.ADMIN_EMAIL,
      subject: subject,
      body: body
    });
    console.log("New order email sent to admin.");
  } catch (e) {
    console.error("Failed to send new order email:", e);
  }
}

// ============================================
// 4. DASHBOARD (Dashboard.gs)
// ============================================
function createOrUpdateDashboardSheet(spreadsheet, websiteTitle) {
  let dashboardSheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.DASHBOARD);
  if (!dashboardSheet) {
    dashboardSheet = spreadsheet.insertSheet(CONFIG.SHEET_NAMES.DASHBOARD);
    dashboardSheet.setTabColor("#1a73e8");
  } else {
    dashboardSheet.clear();
  }
  
  dashboardSheet.setHiddenGridlines(true);
  
  // Header
  dashboardSheet.getRange("B2:M3").merge()
    .setValue(`${websiteTitle} | ORDER DASHBOARD`)
    .setBackground("#202124")
    .setFontColor("#ffffff")
    .setFontSize(18)
    .setFontWeight("bold")
    .setVerticalAlignment("middle");

  const ordersSheet = CONFIG.SHEET_NAMES.ORDERS;
  
  // Helper formulas for single sheet
  const getSumFormula = (col) => {
    return `SUM(IFERROR(ARRAYFORMULA(VALUE(SUBSTITUTE(SUBSTITUTE('${ordersSheet}'!${col}2:${col},"₱",""),",",""))), 0))`;
  };
  
  const getCountFormula = (col) => {
    return `COUNTA('${ordersSheet}'!${col}2:${col})`;
  };
  
  const getPendingFormula = () => {
    return `COUNTIF('${ordersSheet}'!L2:L, "Pending") + COUNTIF('${ordersSheet}'!L2:L, "Processing")`;
  };

  // KPI Cards
  createModernCard(dashboardSheet, "B5:E8", "TOTAL REVENUE", "=" + getSumFormula("J"), "₱#,##0.00", "#0f9d58");
  createModernCard(dashboardSheet, "F5:I8", "TOTAL ORDERS", "=" + getCountFormula("A"), "0", "#4285f4");
  createModernCard(dashboardSheet, "J5:M8", "PENDING ORDERS", "=" + getPendingFormula(), "0", "#db4437");

  // Charts Data Preparation (Hidden Columns O, P)
  // We use formulas for Status Distribution so it updates in real-time
  
  // Write Status Data Headers
  dashboardSheet.getRange("O1:P1").setValues([["Status", "Count"]]);
  dashboardSheet.getRange("O1:P1").setFontWeight("bold").setBackground("#f1f3f4");
  
  // Write Status Data Formulas
  CONFIG.ORDER_STATUS_OPTIONS.forEach((status, index) => {
    const row = 2 + index;
    dashboardSheet.getRange(row, 15).setValue(status); // Col O (15)
    const formula = `=COUNTIF('${ordersSheet}'!L2:L, "${status}")`;
    dashboardSheet.getRange(row, 16).setFormula(formula); // Col P (16)
  });
  
  // For Top Products, we still need static calculation because parsing is complex
  const stats = calculateAggregatedStats(spreadsheet);
  
  // Write Top Products Data
  dashboardSheet.getRange("S1:T1").setValues([["Product", "Qty"]]);
  if (stats.productData.length) {
    dashboardSheet.getRange(2, 19, stats.productData.length, 2).setValues(stats.productData);
  }

  // Charts
  const pieChart = dashboardSheet.newChart()
    .setChartType(Charts.ChartType.PIE)
    .addRange(dashboardSheet.getRange(1, 15, CONFIG.ORDER_STATUS_OPTIONS.length + 1, 2)) // O1:P8
    .setPosition(10, 2, 0, 0)
    .setOption('title', 'Order Status Distribution')
    .setOption('pieHole', 0.4)
    .setOption('width', 550)
    .setOption('height', 350)
    .build();
  dashboardSheet.insertChart(pieChart);

  const barChart = dashboardSheet.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dashboardSheet.getRange("S1:T6")) // Top 5
    .setPosition(10, 8, 0, 0)
    .setOption('title', 'Top 5 Best Sellers')
    .setOption('legend', {position: 'none'})
    .setOption('width', 550)
    .setOption('height', 350)
    .build();
  dashboardSheet.insertChart(barChart);

  // Remove leftover image named "pic1" if present (some templates include an embedded picture)
  try {
    // Try to remove over-grid images (newer API)
    if (dashboardSheet.getImages) {
      const images = dashboardSheet.getImages();
      images.forEach(img => {
        try {
          const title = (img.getAltTextTitle && img.getAltTextTitle()) || (img.getAltTextDescription && img.getAltTextDescription());
          if (title === 'pic1') {
            img.remove();
            console.log('Removed image pic1 from dashboard');
          }
        } catch (e) {}
      });
    }

    // Try to remove drawings/legacy images
    if (dashboardSheet.getDrawings) {
      const draws = dashboardSheet.getDrawings();
      draws.forEach(d => {
        try {
          if (d.getAltTextTitle && d.getAltTextTitle() === 'pic1') {
            d.remove();
            console.log('Removed drawing pic1 from dashboard');
          }
        } catch (e) {}
      });
    }
  } catch (err) {
    console.warn('Unable to remove image pic1:', err);
  }

  // Write recent orders (Top 8 newest) at the bottom of the dashboard
  writeRecentOrders(spreadsheet, dashboardSheet, ordersSheet);
}

function createModernCard(sheet, rangeStr, title, formula, numFormat, accentColor) {
  const range = sheet.getRange(rangeStr);
  range.merge()
    .setFormula(formula)
    .setNumberFormat(numFormat)
    .setFontSize(28)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setBackground("#ffffff")
    .setBorder(true, true, true, true, null, null, "#dadce0", SpreadsheetApp.BorderStyle.SOLID);
    
  const titleRange = sheet.getRange(range.getRow() - 1, range.getColumn(), 1, range.getNumColumns());
  titleRange.merge()
    .setValue(title)
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(accentColor);
    
  range.setBorder(true, true, true, true, null, null, accentColor, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

function calculateAggregatedStats(spreadsheet) {
  const sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAMES.ORDERS);
  const statusCounts = {};
  const productCounts = {};
  
  if (sheet && sheet.getLastRow() >= 2) {
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
    
    data.forEach(row => {
      // Status is now column L (index 11)
      const status = row[11] || "Unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      // Items is now column H (index 7)
      let itemsStr = row[7].toString();
      let items = itemsStr.includes("\n") ? itemsStr.split("\n") : itemsStr.split(",");
      items.forEach(item => {
        let parts = item.trim().split(" x");
        if (parts.length >= 2) {
          let name = parts[0].trim();
          // Remove options in parentheses
          name = name.replace(/\s*\(.*\)/, "");
          let qty = parseInt(parts[1]) || 1;
          productCounts[name] = (productCounts[name] || 0) + qty;
        }
      });
    });
  }
  
  const statusData = Object.keys(statusCounts).map(s => [s, statusCounts[s]]);
  const productData = Object.keys(productCounts)
    .map(p => [p, productCounts[p]])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    
  return { statusData, productData };
}

/**
 * Write top 8 recent orders at the bottom of the dashboard
 * Writes a styled table starting at row 29, columns B:G on the dashboard
 */
function writeRecentOrders(spreadsheet, dashboardSheet, ordersSheetName) {
  // We will render columns B:H as:
  // B: Order ID, C: Date/Time, D: Customer, E: Order Type, F: Items, G: Total, H: Status
  const startRow = 29;
  const numCols = 7;
  const headers = ["Order ID", "Date/Time", "Customer", "Order Type", "Items", "Total", "Status"];

  // Clear previous area (header + 20 rows to be safe)
  dashboardSheet.getRange(startRow, 2, 20, numCols).clear();

  // 1. HEADER
  const headerRange = dashboardSheet.getRange(startRow, 2, 1, numCols);
  headerRange.setValues([headers]);
  headerRange.setBackground("#202124");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

  // 2. DATA (Formula-driven, always up-to-date)
  const dataRowCount = 8;
  const dataRange = dashboardSheet.getRange(startRow + 1, 2, dataRowCount, numCols);
  dataRange.clear({ contentsOnly: true });

  // QUERY columns (A:L):
  // A=Order ID, B=Date/Time, C=Customer Name, F=Order Type, H=Items, J=Total, L=Status
  const queryFormula = `=IFERROR(QUERY('${ordersSheetName}'!A2:L, "select A,B,C,F,H,J,L where A is not null order by B desc limit 8", 0), "")`;
  dashboardSheet.getRange(startRow + 1, 2).setFormula(queryFormula);

  // Styling for the fixed 8-row area (keeps a consistent "pro" look)
  dataRange.setVerticalAlignment("middle");
  dataRange.setBorder(true, true, true, true, true, true, "#dadce0", SpreadsheetApp.BorderStyle.SOLID);
  dataRange.setFontSize(10);

  // Zebra striping
  for (let i = 0; i < dataRowCount; i++) {
    if (i % 2 === 1) {
      dashboardSheet.getRange(startRow + 1 + i, 2, 1, numCols).setBackground("#f8f9fa");
    } else {
      dashboardSheet.getRange(startRow + 1 + i, 2, 1, numCols).setBackground("#ffffff");
    }
  }

  // Alignment
  dashboardSheet.getRange(startRow + 1, 3, dataRowCount, 1)
    .setHorizontalAlignment("center")
    .setNumberFormat("yyyy-mm-dd hh:mm:ss"); // Date/Time
  dashboardSheet.getRange(startRow + 1, 5, dataRowCount, 1).setHorizontalAlignment("center"); // Order Type
  dashboardSheet.getRange(startRow + 1, 7, dataRowCount, 1).setHorizontalAlignment("right");  // Total
  dashboardSheet.getRange(startRow + 1, 8, dataRowCount, 1).setHorizontalAlignment("center"); // Status

  // Currency format for Total column (G)
  try {
    dashboardSheet.getRange(startRow + 1, 7, dataRowCount, 1).setNumberFormat('₱#,##0.00');
  } catch (e) {
    // Ignore if formatting fails
  }
}

// ============================================
// EMAIL NOTIFICATION SYSTEM
// ============================================

/**
 * NOTE:
 * To enable automatic email notifications when you change the Order Status in the spreadsheet,
 * you must install the "CLIENT_SHEET_SCRIPT.js" directly into the generated spreadsheet.
 * 
 * This script (ORDER_TRACKING_SCRIPT.js) runs as a standalone Web App and cannot 
 * detect edits made inside the spreadsheets it creates.
 */
