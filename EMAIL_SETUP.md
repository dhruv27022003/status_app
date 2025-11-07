# Email Notification Setup Guide

This guide will help you configure email notifications for incident alerts.

## Prerequisites

- Gmail account (for testing)
- Gmail App Password (see instructions below)

## Step 1: Enable Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already enabled)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** as the app and **Other (Custom name)** as the device
5. Enter "Status Page" as the custom name
6. Click **Generate**
7. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

## Step 2: Configure Environment Variables

Add these variables to your `.env` file in the `backend` directory:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Status Page

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3001
```

### Example Configuration

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=john.doe@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=john.doe@gmail.com
EMAIL_FROM_NAME=Status Page
FRONTEND_URL=http://localhost:3001
```

## Step 3: Test Email Configuration

1. Start your backend server
2. Create a new incident through the dashboard
3. Check your email inbox for the notification

## Email Triggers

Emails are automatically sent when:

1. **Incident Created** - When a new incident is reported
2. **Incident Status Updated** - When incident status changes (investigating → identified)
3. **Incident Resolved** - When incident status changes to "resolved"

## Troubleshooting

### Email not sending?

1. **Check Gmail App Password**: Make sure you're using the App Password, not your regular Gmail password
2. **Check Environment Variables**: Verify all email variables are set correctly in `.env`
3. **Check Console Logs**: Look for error messages in the backend console
4. **Gmail Limits**: Free Gmail accounts have a limit of ~500 emails per day

### Common Errors

- **"Invalid login"**: Check your EMAIL_USER and EMAIL_PASSWORD
- **"Connection timeout"**: Check EMAIL_HOST and EMAIL_PORT
- **"Authentication failed"**: Make sure you're using an App Password, not your regular password

## Production Setup

For production, consider using:
- **SendGrid** (recommended)
- **Mailgun**
- **AWS SES**
- **Custom SMTP server**

Update the environment variables accordingly.

## Security Notes

- ⚠️ **Never commit `.env` file to git**
- ⚠️ **Use App Passwords, not regular passwords**
- ⚠️ **Keep your App Password secure**

