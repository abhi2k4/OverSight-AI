// EmailJS Configuration
// To set up EmailJS:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Create an email service (Gmail, Outlook, etc.)
// 3. Create an email template with these variables:
//    - {{from_name}} - User's name
//    - {{from_email}} - User's email
//    - {{job_role}} - User's job role
//    - {{to_name}} - Your team name
//    - {{reply_to}} - User's email for replies
// 4. Get your Public Key from Account settings
// 5. Replace the values below with your actual credentials

export const emailJsConfig = {
  serviceId: 'service_oudk9ra', // e.g., 'service_abc123'
  contactFormTemplateId: 'template_rcu13gx', // Template for contact form (to your team)
  autoReplyTemplateId: 'template_bwjt4fa', // Template for auto-reply (to user) - change if you have a separate template
  publicKey: 'UTRBlH1a4iGLj6UfY', // e.g., 'abcdef123456'
};

// Example EmailJS Template (HTML):
/*
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7C3AED; color: white; padding: 20px; border-radius: 8px; }
    .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
    .field { margin: 10px 0; }
    .label { font-weight: bold; color: #333; }
    .value { color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact from OverSight AI Website</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Name:</span>
        <span class="value">{{from_name}}</span>
      </div>
      <div class="field">
        <span class="label">Email:</span>
        <span class="value">{{from_email}}</span>
      </div>
      <div class="field">
        <span class="label">Job Role:</span>
        <span class="value">{{job_role}}</span>
      </div>
    </div>
  </div>
</body>
</html>
*/

// Auto-Reply Template (Create a second template for confirmation):
/*
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #7C3AED; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #fff; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 8px 8px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
    .button { background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Thank You for Your Interest!</h1>
    </div>
    <div class="content">
      <p>Hi {{from_name}},</p>
      <p>Thank you for reaching out to OverSight AI! We've received your inquiry and our team will get back to you within 24 hours.</p>
      <p>In the meantime, feel free to:</p>
      <ul>
        <li>Check out our <a href="https://oversight-docs.vercel.app/docs">documentation</a></li>
        <li>Explore our <a href="https://github.com/abhi2k4/GRACE_Knowcode_OverSight">GitHub repository</a></li>
        <li>Read more about AI governance on our blog</li>
      </ul>
      <p>Best regards,<br>The OverSight AI Team</p>
      <a href="#" class="button">Visit Our Website</a>
    </div>
    <div class="footer">
      <p>© 2026 OverSight AI. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
*/
