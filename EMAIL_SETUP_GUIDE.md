# Email Configuration Guide - Production Setup

## Problem
Emails were not being sent in production because **Render's free tier blocks SMTP connections**. The code was intentionally skipping email in production.

## Solution
The backend now supports **SendGrid** (recommended) or **SMTP** fallback for email sending.

---

## Option 1: SendGrid (Recommended for Production) ⭐

### Why SendGrid?
- ✅ Works on Render free tier (no port restrictions)
- ✅ Free tier: 100 emails/day
- ✅ Reliable email delivery
- ✅ Easy setup with API key

### Step 1: Create SendGrid Account
1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Verify your email
4. In dashboard, go to **Settings** → **API Keys**
5. Create a new API key with "Mail Send" permission
6. Copy the API key (starts with `SG.`)

### Step 2: Configure Render Environment
1. Go to your **Render Dashboard**
2. Select your backend service
3. Go to **Environment** → **Environment Variables**
4. Add these variables:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   FROM_EMAIL=noreply@smartroad.com
   FROM_NAME=Smart Road Management
   ```
5. Click **Save** → Render will auto-redeploy

### Step 3: Verify Email Sending
1. Deploy changes (already done via git push)
2. Test by:
   - Register a new user → Should receive verification email
   - Login and try password reset → Should receive reset email
   - Submit a report → Should receive confirmation email

### Testing Locally (Development)
If using SendGrid locally too:
```bash
# Add to .env
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@smartroad.com
FROM_NAME=Smart Road Management
```

Then test:
```bash
npm run dev
# Register a user and check email
```

---

## Option 2: SMTP (Gmail, Office 365, Custom)

### Using Gmail
1. **Enable 2-Factor Authentication** on Gmail account
2. **Create App Password**:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select Mail + Windows Computer
   - Copy the 16-character password
3. **Set Environment Variables** on Render:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx (16-char app password)
   FROM_EMAIL=your-email@gmail.com
   FROM_NAME=Smart Road Management
   ```

### Using Office 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
FROM_EMAIL=your-email@company.com
FROM_NAME=Smart Road Management
```

### Using Custom SMTP
```
SMTP_HOST=mail.example.com
SMTP_PORT=587 (or 465 for SSL)
SMTP_USER=username
SMTP_PASS=password
FROM_EMAIL=noreply@example.com
FROM_NAME=Your App Name
```

---

## How It Works

### Email Detection Logic
```javascript
// Backend automatically detects which service to use
if (process.env.SENDGRID_API_KEY) {
  // Use SendGrid
  console.log('✅ Using SendGrid for email');
} else {
  // Fall back to SMTP
  console.log('✅ Using SMTP for email');
}
```

### Email Flow
1. User performs action (register, password reset, etc.)
2. Backend loads email template (HTML)
3. Renders template with user data
4. Sends via SendGrid or SMTP
5. Logs success/failure

### Email Templates
Located in: `backend/public/email-templates/`

Available templates:
- `welcome.html` - Welcome email
- `email-verification.html` - Email verification
- `password-reset.html` - Password reset
- `report-submitted.html` - Report confirmation
- `notification.html` - General notifications
- And more...

---

## Troubleshooting

### Email not being sent?

**1. Check logs**
```bash
# On Render, check logs:
# Dashboard → Your Service → Logs
# Look for: "Email sent via SendGrid" or "Email sent via SMTP"
```

**2. Verify environment variables**
```bash
# Check in Render dashboard that variables are set
# Settings → Environment Variables
```

**3. Check email templates**
- Ensure templates exist in `backend/public/email-templates/`
- If missing, backend creates default templates

**4. SendGrid specific**
- Verify API key is correct
- Check SendGrid dashboard → Activity → Recent
- Ensure FROM_EMAIL matches verified sender

**5. SMTP specific**
- Gmail: Make sure you created an App Password (not regular password)
- Office 365: Enable "Allow less secure apps" or use App Password
- Custom SMTP: Verify host, port, and credentials with provider

### "Template not found" error?
The backend will automatically create default templates if they don't exist. Check backend logs:
```
📧 Created default email templates
```

### Email is being sent but not received?
- Check spam/junk folder
- Verify sender email is not in spam list
- For SendGrid: Check deliverability dashboard

---

## Production Checklist

- [ ] SendGrid API key added to Render environment
- [ ] FROM_EMAIL environment variable set
- [ ] FROM_NAME environment variable set (optional)
- [ ] Backend redeployed after adding variables
- [ ] Tested registration (user should receive verification email)
- [ ] Tested password reset (should receive reset link)
- [ ] Tested report submission (should receive confirmation)
- [ ] Checked Render logs for email status messages

---

## Development Testing

### Test emails locally
```bash
# Set SendGrid API key in .env
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=test@example.com

# Run backend
npm run dev

# Register a new user via frontend
# Check your email (the one you set in FROM_EMAIL)
```

### Test without actual sending
You can temporarily disable emails in code:
```javascript
// Temporarily skip email in development
if (process.env.SKIP_EMAIL === 'true') {
  console.log('📧 Email skipped (SKIP_EMAIL=true)');
  return { success: true, messageId: 'SKIPPED' };
}
```

---

## Email Statistics

### SendGrid Dashboard
- Go to SendGrid Dashboard
- View **Email Activity** → see all sent emails
- View **Stats** → bounce, open, click rates
- Monitor **Deliverability** → spam reports, bounces

### What gets emailed?
1. **User Registration** → Verification email
2. **Email Verification** → Confirmation when verified
3. **Password Reset** → Reset link email
4. **Report Submission** → Confirmation to citizen
5. **Report Status Updates** → Notifications to users
6. **Feedback Requests** → When feedback requested
7. **Admin Notifications** → New reports, assignments

---

## Cost Analysis

| Service | Free Tier | Cost |
|---------|-----------|------|
| SendGrid | 100 emails/day | $20/month (or $0.0001 per extra) |
| Gmail (SMTP) | Unlimited* | Free (or $6/user/month for Google Workspace) |
| Brevo (Sendinblue) | 300 emails/day | Free → paid |
| AWS SES | 62,000 emails/month free first year | $0.10 per 1000 thereafter |

*Gmail has rate limits (100/day, 2000/day for Workspace)

---

## File Changes

### Modified Files
1. **backend/src/services/email.service.js**
   - Added SendGrid support
   - Auto-detection logic
   - Better error handling

2. **backend/package.json**
   - Added `@sendgrid/mail` dependency

3. **backend/.env.example** (NEW)
   - Email configuration options
   - All environment variables documented

---

## Next Steps

1. ✅ Code already deployed
2. **TODO**: Add SendGrid API key to Render
3. **TODO**: Test emails work
4. **TODO**: Monitor email delivery in dashboard

Once you add the API key to Render, emails will start working immediately! 🚀
