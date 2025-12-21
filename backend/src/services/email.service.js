const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('✅ SMTP server is ready to take our messages');
  }
});

// Load email templates
const templates = {};

const loadTemplates = async () => {
  const templatesDir = path.join(__dirname, '../../public/email-templates');
  
  try {
    const files = await fs.readdir(templatesDir);
    
    for (const file of files) {
      if (file.endsWith('.html')) {
        const templateName = path.basename(file, '.html');
        const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
        templates[templateName] = content;
      }
    }
    
    console.log(`✅ Loaded ${Object.keys(templates).length} email templates`);
  } catch (error) {
    console.error('Error loading email templates:', error);
  }
};

// Load templates on startup
loadTemplates();

// Render template with variables
const renderTemplate = (templateName, context = {}) => {
  let template = templates[templateName];
  
  if (!template) {
    template = templates['default'] || '<h1>${title}</h1><p>${message}</p>';
  }
  
  // Replace variables in template
  Object.keys(context).forEach(key => {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
    template = template.replace(regex, context[key]);
  });
  
  return template;
};

// Send email function
exports.sendEmail = async ({ to, subject, template, context = {}, attachments = [] }) => {
  try {
    // Default context
    const defaultContext = {
      year: new Date().getFullYear(),
      appName: 'Smart Road Management',
      appUrl: process.env.CLIENT_URL,
      supportEmail: 'support@smartroad.com'
    };

    const emailContext = { ...defaultContext, ...context };
    
    const html = renderTemplate(template, emailContext);
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
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

// Send batch emails
exports.sendBatchEmails = async (emails) => {
  const results = [];
  
  for (const email of emails) {
    try {
      const result = await exports.sendEmail(email);
      results.push({ success: true, email: email.to, messageId: result.messageId });
    } catch (error) {
      results.push({ success: false, email: email.to, error: error.message });
    }
  }
  
  return results;
};