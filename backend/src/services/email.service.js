const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Register Handlebars helpers
handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
});

handlebars.registerHelper('if', function(conditional, options) {
  if (conditional) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

// Create transporter - Support both SMTP and SendGrid
let transporter;

if (process.env.SENDGRID_API_KEY) {
  // Use SendGrid for production
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  transporter = { useSendGrid: true, client: sgMail };
  console.log('✅ SendGrid configured for email sending');
} else {
  // Use SMTP fallback
  transporter = nodemailer.createTransport({
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
      console.error('❌ SMTP connection error:', error);
    } else {
      console.log('✅ SMTP server is ready');
    }
  });
}

// Load email templates
const templates = {};

const loadTemplates = async () => {
  const templatesDir = path.join(__dirname, '../../public/email-templates');
  
  try {
    // Ensure directory exists
    try {
      await fs.access(templatesDir);
    } catch {
      await fs.mkdir(templatesDir, { recursive: true });
      console.log('📁 Created email templates directory');
    }

    const files = await fs.readdir(templatesDir);
    
    // Load existing templates
    for (const file of files) {
      if (file.endsWith('.html')) {
        const templateName = path.basename(file, '.html');
        const content = await fs.readFile(path.join(templatesDir, file), 'utf8');
        templates[templateName] = handlebars.compile(content);
        console.log(`📧 Loaded template: ${templateName}`);
      }
    }
    
    // Create default templates if none exist
    if (Object.keys(templates).length === 0) {
      console.log('⚠️  No email templates found, creating default templates...');
      await createDefaultTemplates();
    }
  } catch (error) {
    console.error('Error loading email templates:', error);
    await createDefaultTemplates();
  }
};

// Create default templates
const createDefaultTemplates = async () => {
  const templatesDir = path.join(__dirname, '../../public/email-templates');
  
  const defaultTemplates = {
    'report-submitted': `<!DOCTYPE html>
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
        .detail-row { display: flex; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .detail-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .detail-label { font-weight: 600; color: #555; width: 150px; flex-shrink: 0; }
        .detail-value { color: #222; flex: 1; }
        .status-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Report Submitted Successfully!</h1>
    </div>
    <div class="content">
        <p>Hello {{name}},</p>
        <p>Your road issue report has been received and will be reviewed by our team.</p>
        
        <div class="report-details">
            <h3>Report Details:</h3>
            <div class="detail-row">
                <div class="detail-label">Report ID:</div>
                <div class="detail-value"><strong>#{{reportId}}</strong></div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Title:</div>
                <div class="detail-value">{{title}}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Category:</div>
                <div class="detail-value">
                    {{#ifEquals category "pothole"}}🕳️ Pothole{{/ifEquals}}
                    {{#ifEquals category "drainage"}}💧 Drainage{{/ifEquals}}
                    {{#ifEquals category "lighting"}}💡 Street Lighting{{/ifEquals}}
                    {{#ifEquals category "garbage"}}🗑️ Garbage{{/ifEquals}}
                    {{#ifEquals category "signage"}}🪧 Road Signage{{/ifEquals}}
                    {{#ifEquals category "other"}}📝 Other Issue{{/ifEquals}}
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Location:</div>
                <div class="detail-value">{{address}}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Submitted on:</div>
                <div class="detail-value">{{date}}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="status-badge">⏳ Pending Review</span>
                </div>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/dashboard/reports/{{reportId}}" class="button">Track Your Report</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'report-assigned': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Report Assigned</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196F3 0%, #0d8bf2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .task-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #2196F3; margin: 20px 0; }
        .priority-high { background: #ffebee; border-left: 4px solid #f44336; }
        .priority-medium { background: #fff3e0; border-left: 4px solid #ff9800; }
        .priority-low { background: #e8f5e9; border-left: 4px solid #4caf50; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #2196F3; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Report Assigned to You</h1>
    </div>
    <div class="content">
        <p>Hello {{staffName}},</p>
        <p>A new report has been assigned to you for action.</p>
        
        <div class="task-details {{#ifEquals priority 'high'}}priority-high{{/ifEquals}} {{#ifEquals priority 'medium'}}priority-medium{{/ifEquals}} {{#ifEquals priority 'low'}}priority-low{{/ifEquals}}">
            <h3>Task Details:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
            <p><strong>Location:</strong> {{location}}</p>
            {{#if dueDate}}
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            {{/if}}
            {{#if assignedBy}}
            <p><strong>Assigned by:</strong> {{assignedBy}}</p>
            {{/if}}
        </div>
        
        <p>Please review the report and begin work as soon as possible.</p>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/staff/reports/{{reportId}}" class="button">View Report Details</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'progress-update': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Progress Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .progress-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #FF9800; margin: 20px 0; }
        .progress-bar { height: 20px; background: #e0e0e0; border-radius: 10px; margin: 15px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #FF9800 0%, #F57C00 100%); border-radius: 10px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #FF9800; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Report Progress Updated</h1>
    </div>
    <div class="content">
        <p>Hello {{name}},</p>
        <p>The progress has been updated for your report.</p>
        
        <div class="progress-details">
            <h3>Progress Update:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Current Status:</strong> {{status}}</p>
            <p><strong>Progress:</strong> {{progress}}% complete</p>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: {{progress}}%"></div>
            </div>
            
            {{#if description}}
            <p><strong>Update:</strong> {{description}}</p>
            {{/if}}
            
            {{#if imageCount}}
            <p><strong>Images Added:</strong> {{imageCount}} new photos</p>
            {{/if}}
            
            <p><strong>Updated by:</strong> {{updatedBy}}</p>
            <p><strong>Date:</strong> {{date}}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/dashboard/reports/{{reportId}}" class="button">View Report Progress</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'task-completed': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Completed - Awaiting Review</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .completion-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .status-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Task Completed - Awaiting Review</h1>
    </div>
    <div class="content">
        <p>Hello {{adminName}},</p>
        <p>A staff member has completed a task that requires your review.</p>
        
        <div class="completion-details">
            <h3>Completion Details:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Completed by:</strong> {{staffName}}</p>
            <p><strong>Completion Time:</strong> {{completionTime}} hours</p>
            <p><strong>Status:</strong> <span class="status-badge">✅ Completed - Needs Review</span></p>
            
            {{#if completionNotes}}
            <p><strong>Staff Notes:</strong> {{completionNotes}}</p>
            {{/if}}
            
            {{#if imageCount}}
            <p><strong>Completion Images:</strong> {{imageCount}} photos uploaded</p>
            {{/if}}
            
            <p><strong>Date Completed:</strong> {{date}}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/admin/reports/{{reportId}}/review" class="button">Review Task Completion</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'task-approved': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Approved by Admin</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .approval-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #4CAF50; margin: 20px 0; }
        .status-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Task Approved! 🎉</h1>
    </div>
    <div class="content">
        <p>Hello {{staffName}},</p>
        <p>Great news! The admin has approved your completed work.</p>
        
        <div class="approval-details">
            <h3>Approval Details:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Approved by:</strong> {{approvedBy}}</p>
            <p><strong>Status:</strong> <span class="status-badge">✅ Approved</span></p>
            
            {{#if adminNotes}}
            <p><strong>Admin Notes:</strong> {{adminNotes}}</p>
            {{/if}}
            
            <p><strong>Date Approved:</strong> {{date}}</p>
        </div>
        
        <p>Thank you for your excellent work! This task is now officially closed.</p>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/staff/reports/{{reportId}}" class="button">View Approved Task</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'task-rejected': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Task Needs Revision</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .rejection-details { background: #ffebee; padding: 20px; border-radius: 5px; border-left: 4px solid #f44336; margin: 20px 0; }
        .status-badge { display: inline-block; background: #ffcdd2; color: #c62828; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #f44336; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Task Needs Revision</h1>
    </div>
    <div class="content">
        <p>Hello {{staffName}},</p>
        <p>The admin has reviewed your completed task and has requested revisions.</p>
        
        <div class="rejection-details">
            <h3>Revision Request:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Requested by:</strong> {{requestedBy}}</p>
            <p><strong>Status:</strong> <span class="status-badge">🔄 Needs Revision</span></p>
            
            {{#if rejectionReason}}
            <p><strong>Reason for Revision:</strong> {{rejectionReason}}</p>
            {{/if}}
            
            {{#if adminNotes}}
            <p><strong>Admin Instructions:</strong> {{adminNotes}}</p>
            {{/if}}
            
            <p><strong>Date Requested:</strong> {{date}}</p>
        </div>
        
        <p>Please review the feedback and make the necessary revisions. The report has been returned to "In Progress" status.</p>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/staff/reports/{{reportId}}" class="button">Review and Revise</a>
        </div>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`,

    'user-report-completed': `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Report Has Been Resolved!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 10px 10px; }
        .completion-details { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #9C27B0; margin: 20px 0; }
        .status-badge { display: inline-block; background: #f3e5f5; color: #7b1fa2; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #9C27B0; color: white; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Report Has Been Resolved! 🎉</h1>
    </div>
    <div class="content">
        <p>Hello {{name}},</p>
        <p>Great news! The road issue you reported has been successfully resolved.</p>
        
        <div class="completion-details">
            <h3>Resolution Details:</h3>
            <p><strong>Report ID:</strong> #{{reportId}}</p>
            <p><strong>Title:</strong> {{title}}</p>
            <p><strong>Category:</strong> {{category}}</p>
            <p><strong>Location:</strong> {{location}}</p>
            <p><strong>Status:</strong> <span class="status-badge">✅ Resolved</span></p>
            <p><strong>Completed by:</strong> {{staffName}}</p>
            <p><strong>Completion Date:</strong> {{date}}</p>
            <p><strong>Time to Resolve:</strong> {{resolutionTime}}</p>
        </div>
        
        <p>We would appreciate your feedback on the work done. Your input helps us improve our services.</p>
        
        <div style="text-align: center;">
            <a href="{{appUrl}}/dashboard/reports/{{reportId}}/feedback" class="button">Provide Feedback</a>
        </div>
        
        <p>Thank you for helping make our roads safer!</p>
        
        <p>Best regards,<br>The {{appName}} Team</p>
    </div>
    <div class="footer">
        <p>© {{year}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>`
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
    // ⚠️ PRODUCTION: Skip email sending on Render free tier (SMTP blocked)
    if (process.env.NODE_ENV === 'production') {
      console.log(`📧 [PRODUCTION] Email skipped - Render free tier blocks SMTP`);
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Template: ${template}`);
      return { 
        messageId: 'SKIPPED_IN_PRODUCTION',
        message: 'Email skipped in production mode'
      };
    }

    // Ensure templates are loaded
    if (Object.keys(templates).length === 0) {
      console.log('📧 Templates not loaded yet, loading now...');
      await loadTemplates();
    }

    // Get template
    const templateFn = templates[template];
    if (!templateFn) {
      throw new Error(`Template "${template}" not found. Available: ${Object.keys(templates).join(', ')}`);
    }

    // Default context
    const defaultContext = {
      year: new Date().getFullYear(),
      appName: 'Smart Road Management',
      appUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      supportEmail: 'support@smartroad.com',
      currentDate: new Date().toLocaleDateString()
    };

    const emailContext = { ...defaultContext, ...context };
    
    // Render template
    const html = templateFn(emailContext);
    
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Smart Road Management'}" <${process.env.FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      attachments
    };

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Using template: ${template}`);
    console.log(`📧 Subject: ${subject}`);

    // Use SendGrid if configured, otherwise use SMTP
    if (transporter.useSendGrid) {
      const msg = {
        to: Array.isArray(to) ? to[0] : to,
        from: process.env.FROM_EMAIL || 'noreply@smartroad.com',
        subject,
        html,
        attachments: attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }))
      };

      const result = await transporter.client.send(msg);
      console.log(`✅ Email sent via SendGrid to ${to}: ${result[0]?.messageId}`);
      return { 
        messageId: result[0]?.messageId || 'SENT',
        success: true
      };
    } else {
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}: ${info.messageId}`);
      return info;
    }
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    // Log but don't throw - email failures shouldn't block operations
    return { 
      messageId: 'ERROR',
      error: error.message,
      success: false
    };
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