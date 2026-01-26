# Render Environment Variables Setup

This file contains the environment variables you need to add to Render.

## Steps to Add to Render Dashboard:

1. Go to: https://dashboard.render.com
2. Select your backend service (citizen-road-backend)
3. Click on "Environment" tab
4. Click "Add Environment Variable" and add these:

### Email Configuration (SendGrid)

```
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
FROM_EMAIL=tejdeepak2005@gmail.com
FROM_NAME=Smart Road Management
```

**NOTE**: The actual API key is in your local backend/.env file (not committed to git for security)

### How to Add Each Variable:

1. In the "Environment" section, click the "+" button
2. Enter the key (e.g., `SENDGRID_API_KEY`)
3. Enter the value (paste the full key/value)
4. Click "Add"
5. Repeat for each variable
6. At the bottom, click "Save" to deploy

Once you click Save, Render will automatically redeploy your backend with these new variables.

## Verification

After deployment (2-3 minutes), check the logs:
- Go to your backend service Logs
- Look for: `✅ SendGrid configured for email sending`
- This confirms emails will now work!

## What Happens Next

- User registrations will send verification emails
- Password resets will send reset links
- Report confirmations will be emailed
- All emails will be sent via SendGrid

## Security Note

Never commit the SENDGRID_API_KEY to public repositories. 
The .env file is already in .gitignore on this project, so you're safe. ✅
