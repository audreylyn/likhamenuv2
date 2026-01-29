/**
 * Google Apps Script - Knowledge Base API
 * Deploy this as a Web App to serve knowledge base content from Google Sheets
 * 
 * Setup:
 * 1. Create a Google Spreadsheet
 * 2. Create tabs named after your websites (e.g., "rose", "starbucks", "default")
 * 3. Add business information in each tab (use column A for simple text format)
 * 4. Go to Extensions → Apps Script
 * 5. Paste this code
 * 6. Deploy → New Deployment → Web App
 * 7. Set "Execute as: Me" and "Who has access: Anyone"
 * 8. Copy the Web App URL
 * 9. Paste URL in admin panel
 */

function doGet(e) {
  try {
    const website = e.parameter.website || 'default';
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(website);
    
    // If website-specific sheet doesn't exist, try default
    if (!sheet) {
      sheet = spreadsheet.getSheetByName('default');
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Sheet not found',
          website: website,
          availableSheets: spreadsheet.getSheets().map(s => s.getName())
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return getSheetContent(sheet);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      message: 'Error fetching knowledge base'
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetContent(sheet) {
  const data = sheet.getDataRange().getValues();
  let content = '';
  
  // Format Option 1: Simple text format (all in column A)
  // Recommended for most users
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim()) {
      content += data[i][0].toString().trim() + '\n';
    }
  }
  
  // Format Option 2: Structured format (A: Field, B: Value)
  // Uncomment if you prefer structured format:
  /*
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][1]) {
      const field = data[i][0].toString().trim();
      const value = data[i][1].toString().trim();
      if (field && value) {
        content += field + ': ' + value + '\n';
      }
    }
  }
  */
  
  // Return as plain text (not JSON)
  return ContentService.createTextOutput(content.trim())
    .setMimeType(ContentService.MimeType.TEXT);
}

// For POST requests (optional, for future use)
function doPost(e) {
  return doGet(e);
}

/**
 * Test function - run this to test your setup
 */
function testKnowledgeBase() {
  const testWebsite = 'default'; // Change to your website name
  const result = doGet({ parameter: { website: testWebsite } });
  Logger.log(result.getContent());
}

