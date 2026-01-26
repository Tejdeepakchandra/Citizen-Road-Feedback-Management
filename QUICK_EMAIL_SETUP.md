# Quick Email Setup (5 Minutes)

## TL;DR - SendGrid Setup

### 1. Create SendGrid Account (2 min)
- Go to [sendgrid.com](https://sendgrid.com)
- Sign up → Verify email
- Copy API Key from Settings → API Keys

### 2. Add to Render (2 min)
1. Render Dashboard → Your Backend Service
2. Settings → Environment Variables
3. Add:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   FROM_EMAIL=noreply@smartroad.com
   ```
4. Click Save → Auto-deploys

### 3. Test (1 min)
- Register new user on your app
- Check email for verification link
- ✅ Done!

---

## Environment Variables Needed

**SendGrid:**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@smartroad.com
FROM_NAME=Smart Road Management (optional)
```

**OR Gmail SMTP:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx (app password)
FROM_EMAIL=your-email@gmail.com
```

---

## Verify It's Working

### Check Backend Logs
In Render dashboard logs, you should see:
```
✅ SMTP server is ready
📧 Email sent via SendGrid to user@example.com
```

or

```
✅ SMTP server is ready
✅ Email sent to user@example.com
```

### Test Workflows
1. **Register** → Get verification email ✓
2. **Forgot Password** → Get reset email ✓
3. **Submit Report** → Get confirmation ✓

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No email sent | Check env vars in Render are set |
| Error in logs | Verify API key is correct |
| Goes to spam | Add to contacts or whitelist sender |
| Still not working | Check [SendGrid support](https://support.sendgrid.com) |

---

**That's it!** Emails will work once you add the API key. 🎉
