const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Load email templates
const templates = {};

const loadTemplates = async () => {
  const templatesDir = path.join(__dirname, '../../public/email-templates');
  
  try {
    // Create templates directory if it doesn't exist
    try {
      await fs.access(templatesDir);
    } catch {
      await fs.mkdir(templatesDir, { recursive: true });
      console.log('📁 Created email templates directory');
    }

    const files = await fs.readdir(templatesDir);
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const templateName = path.basename(file, '.html');
        const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
        templates[templateName] = handlebars.compile(content);
        console.log(`📧 Loaded template: ${templateName}`);
      }
    }
    
    if (Object.keys(templates).length === 0) {
      console.log('⚠️  No email templates found, creating default templates...');
      await createDefaultTemplates();
    }
  } catch (error) {
    console.error('Error loading email templates:', error);
    await createDefaultTemplates();
  }
};

// Create default email templates
const createDefaultTemplates = async () => {
  const templatesDir = path.join(__dirname, '../../public/email-templates');
  
  const defaultTemplates = {
    'welcome': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Smart Road Management</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Smart Road Management!</h1>
    </div>
    <div class="content">
        <p>Hello {{name}},</p>
        <p>Thank you for joining our community dedicated to improving road infrastructure. Together, we can make our roads safer and better.</p>
        
        <p>With your account, you can:</p>
        <ul>
            <li>Report road issues in your area</li>
            <li>Track the progress of reported issues</li>
            <li>See before/after transformations</li>
            <li>Donate to support road development</li>
            <li>Give feedback on completed work</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <p>If you have any questions, feel free to contact our support team at {{supportEmail}}.</p>
        
        <p>Best regards,<br>
        The Smart Road Management Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} Smart Road Management. All rights reserved.</p>
        <p>This email was sent to {{email}}. If you didn't create an account, please ignore this email.</p>
    </div>
</body>
</html>
    `,
    
    'report-submitted': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Submitted Successfully</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .report-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Report Submitted Successfully!</h1>
    </div>
    <div class="content">
        <p>Hello {{name}},</p>
        <p>Thank you for reporting the road issue. Your report has been received and will be reviewed by our team.</p>
        
        <div class="report-details">
            <h3>Report Details:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Date Submitted:</strong> {{date}}</p>
            <p><strong>Status:</strong> Pending Review</p>
        </div>
        
        <p>You can track the progress of your report in your dashboard. We'll notify you when:</p>
        <ul>
            <li>Your report is assigned to a staff member</li>
            <li>Work progress is updated</li>
            <li>The issue is resolved</li>
        </ul>
        
        <p>If you need to provide additional information about this report, please reply to this email.</p>
        
        <p>Thank you for helping us improve our roads!</p>
        
        <p>Best regards,<br>
        The Smart Road Management Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} Smart Road Management. All rights reserved.</p>
    </div>
</body>
</html>
    `,
    
    'donation-thankyou': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Donation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .donation-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #FF9800; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Thank You for Your Generous Donation!</h1>
    </div>
    <div class="content">
        <p>Dear {{name}},</p>
        <p>Your donation is making a real difference in improving our community's roads. We sincerely appreciate your support.</p>
        
        <div class="donation-details">
            <h3>Donation Summary:</h3>
            <p><strong>Amount:</strong> ₹{{amount}}</p>
            <p><strong>Date:</strong> {{date}}</p>
            <p><strong>Transaction ID:</strong> {{transactionId}}</p>
        </div>
        
        <p>{{message}}</p>
        
        <p>Your contribution will be used for:</p>
        <ul>
            <li>Repairing potholes and road surfaces</li>
            <li>Installing and maintaining street lights</li>
            <li>Cleaning drainage systems</li>
            <li>Improving road signage</li>
            <li>Community awareness programs</li>
        </ul>
        
        <p>We'll keep you updated on how your donation is making an impact. You can view all your donations in your dashboard.</p>
        
        <p>Once again, thank you for your generosity and for being part of our mission to create better roads for everyone.</p>
        
        <p>With gratitude,<br>
        The Smart Road Management Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} Smart Road Management. All rights reserved.</p>
        <p>This is a tax-deductible donation. You will receive a receipt for your records.</p>
    </div>
</body>
</html>
    `
  };

  for (const [name, content] of Object.entries(defaultTemplates)) {
    const filePath = path.join(templatesDir, `${name}.html`);
    await fs.writeFile(filePath, content.trim());
    templates[name] = handlebars.compile(content);
  }
  
  console.log('📧 Created default email templates');
};

// Load templates on startup
loadTemplates();

// Send email function
exports.sendEmail = async ({ to, subject, template, context = {}, attachments = [] }) => {
  try {
    // Get template
    const templateFn = templates[template];
    if (!templateFn) {
      throw new Error(`Template "${template}" not found`);
    }

    // Default context
    const defaultContext = {
      year: new Date().getFullYear(),
      appName: 'Smart Road Management',
      appUrl: process.env.CLIENT_URL || 'http://localhost:5173',
      supportEmail: 'support@smartroad.com',
      currentDate: new Date().toLocaleDateString()
    };

    const emailContext = { ...defaultContext, ...context };
    
    // Render template
    const html = templateFn(emailContext);
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};

// Send email with template string
exports.sendEmailWithTemplate = async ({ to, subject, html, attachments = [] }) => {
  try {
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};

// Send bulk emails
exports.sendBulkEmail = async (recipients, subject, template, contextGenerator) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const context = contextGenerator ? contextGenerator(recipient) : {};
      const info = await exports.sendEmail({
        to: recipient.email,
        subject,
        template,
        context: { ...context, name: recipient.name, email: recipient.email }
      });
      
      results.push({
        success: true,
        recipient: recipient.email,
        messageId: info.messageId
      });
    } catch (error) {
      results.push({
        success: false,
        recipient: recipient.email,
        error: error.message
      });
    }
  }
  
  return results;
};

// Test email function
exports.testEmail = async () => {
  try {
    const info = await exports.sendEmail({
      to: process.env.SMTP_USER,
      subject: 'Test Email - Smart Road Management',
      template: 'welcome',
      context: {
        name: 'Test User',
        email: process.env.SMTP_USER
      }
    });
    
    console.log('✅ Test email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};