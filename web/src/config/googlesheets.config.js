// Google Sheets Configuration
// To set up Google Apps Script for Sheets:
// 1. Go to https://script.google.com/
// 2. Create a new project
// 3. Copy the Apps Script code below into the editor
// 4. Deploy as Web App with "Anyone" access
// 5. Copy the deployment URL and paste it below

export const googleSheetsConfig = {
  // Replace with your deployed Apps Script URL
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwkD1RbNRTM3-Gxe0KrBlG0Jz_2XjzxCfk-VfzyO92YOWMDf-GbmFW7MQoykNKXqB6z/exec',
};

// Google Apps Script Code (Copy this to script.google.com):
/*
// IMPORTANT: Replace 'YOUR_SPREADSHEET_ID' with your actual spreadsheet ID
// You can find it in the URL: https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

// Helper function to create response with CORS headers
function createResponse(statusCode, data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

// Handle OPTIONS request for CORS preflight
function doOptions(e) {
  const output = ContentService.createTextOutput('');
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  output.addHeader('Access-Control-Max-Age', '86400');
  return output;
}

// Handle GET request (for testing)
function doGet(e) {
  return createResponse(200, {
    status: 'success',
    message: 'Apps Script is working! Use POST to submit data.'
  });
}

// Handle POST request (form submission)
function doPost(e) {
  try {
    // Check if postData exists
    if (!e || !e.postData) {
      return createResponse(400, {
        status: 'error',
        message: 'No post data received'
      });
    }
    
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);
    
    // Validate required fields
    if (!data.name || !data.email) {
      return createResponse(400, {
        status: 'error',
        message: 'Name and email are required'
      });
    }
    
    // Open the specific spreadsheet by ID
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getActiveSheet();
    
    // Add headers if this is the first entry
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Name', 'Job Role', 'Email']);
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, 4);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#7C3AED');
      headerRange.setFontColor('#FFFFFF');
    }
    
    // Append the new row with data
    sheet.appendRow([
      new Date().toLocaleString(),
      data.name || '',
      data.jobTitle || data.jobRole || '',
      data.email || ''
    ]);
    
    // Auto-resize columns
    sheet.autoResizeColumns(1, 4);
    
    // Return success response
    return createResponse(200, {
      status: 'success',
      message: 'Data added successfully',
      rowNumber: sheet.getLastRow()
    });
    
  } catch (error) {
    // Log error for debugging
    Logger.log('Error: ' + error.toString());
    
    // Return error response with details
    return createResponse(500, {
      status: 'error',
      message: error.toString(),
      line: error.lineNumber
    });
  }
}

// Optional: Manual test function (run from Apps Script editor)
function testSubmission() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        name: 'Test User',
        jobTitle: 'Test Developer',
        email: 'test@example.com'
      })
    }
  };
  
  const result = doPost(testData);
  Logger.log(result.getContent());
}
*/

// Deployment Steps:
// 1. In Apps Script editor: Deploy > New deployment
// 2. Select type: Web app
// 3. Description: "Contact Form Submission"
// 4. Execute as: Me
// 5. Who has access: Anyone
// 6. Click "Deploy"
// 7. Copy the Web app URL
// 8. Paste it in appsScriptUrl above
// 9. First time will require authorization - follow the prompts

// Testing your deployment:
// curl -X POST YOUR_APPS_SCRIPT_URL \
//   -H "Content-Type: application/json" \
//   -d '{"name":"Test User","jobTitle":"Developer","email":"test@example.com"}'
