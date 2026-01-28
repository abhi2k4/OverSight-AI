
export const googleSheetsConfig = {
  // Replace with your deployed Apps Script URL
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwkD1RbNRTM3-Gxe0KrBlG0Jz_2XjzxCfk-VfzyO92YOWMDf-GbmFW7MQoykNKXqB6z/exec',
};


// Frontend function to submit data to Google Sheets
export function submitToGoogleSheets(formData) {
  const { name, jobTitle, email, phone } = formData;
  
  return fetch(googleSheetsConfig.appsScriptUrl, {
    method: 'POST',
    mode: 'no-cors', // CRITICAL: This bypasses the CORS preflight check
    headers: {
      'Content-Type': 'application/json' // Use proper content type
    },
    body: JSON.stringify({
      name: name || '',
      jobTitle: jobTitle || '',
      email: email || '',
      phone: phone || ''
    })
  })
    .then(response => {
      // With no-cors mode, we can't read the response body
      // But if the fetch succeeds, the request was sent successfully
      return response;
    })
    .catch(err => {
      console.error('Error submitting to Google Sheets:', err);
      // Don't throw - Google Sheets submission shouldn't block the form
      return null;
    });
}
