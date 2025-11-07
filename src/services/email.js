const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Email templates
const getIncidentCreatedTemplate = (incident, serviceName, userName) => {
  const statusColors = {
    investigating: '#3b82f6', // blue
    identified: '#f59e0b', // yellow
    resolved: '#10b981', // green
  };

  const statusLabels = {
    investigating: 'Investigating',
    identified: 'Identified',
    resolved: 'Resolved',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Incident: ${incident.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ New Incident Reported</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">${incident.title}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[incident.status] || '#3b82f6'};">
          <p style="margin: 0; font-size: 16px; color: #374151;">${incident.message}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Service:</td>
              <td style="padding: 10px 0; color: #111827;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Status:</td>
              <td style="padding: 10px 0;">
                <span style="background: ${statusColors[incident.status] || '#3b82f6'}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                  ${statusLabels[incident.status] || 'Investigating'}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Reported:</td>
              <td style="padding: 10px 0; color: #111827;">${new Date(incident.createdAt).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/status/${incident.userId}" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Status Page
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from your Status Page system.</p>
          <p>You received this email because an incident was created for your service.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getIncidentUpdatedTemplate = (incident, serviceName, userName, oldStatus) => {
  const statusColors = {
    investigating: '#3b82f6',
    identified: '#f59e0b',
    resolved: '#10b981',
  };

  const statusLabels = {
    investigating: 'Investigating',
    identified: 'Identified',
    resolved: 'Resolved',
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Incident Update: ${incident.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">📢 Incident Status Updated</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">${incident.title}</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 15px 0; color: #6b7280; font-weight: bold;">Status Changed:</p>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #9ca3af; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px;">
              ${statusLabels[oldStatus] || 'Previous'}
            </span>
            <span style="color: #6b7280;">→</span>
            <span style="background: ${statusColors[incident.status] || '#3b82f6'}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
              ${statusLabels[incident.status] || 'Current'}
            </span>
          </div>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColors[incident.status] || '#3b82f6'};">
          <p style="margin: 0; font-size: 16px; color: #374151;">${incident.message}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Service:</td>
              <td style="padding: 10px 0; color: #111827;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Current Status:</td>
              <td style="padding: 10px 0;">
                <span style="background: ${statusColors[incident.status] || '#3b82f6'}; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                  ${statusLabels[incident.status] || 'Investigating'}
                </span>
              </td>
            </tr>
            ${incident.resolvedAt ? `
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Resolved:</td>
              <td style="padding: 10px 0; color: #111827;">${new Date(incident.resolvedAt).toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Updated:</td>
              <td style="padding: 10px 0; color: #111827;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/status/${incident.userId}" 
             style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Status Page
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from your Status Page system.</p>
          <p>You received this email because an incident status was updated.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getIncidentResolvedTemplate = (incident, serviceName, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Incident Resolved: ${incident.title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Incident Resolved</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827; margin-top: 0;">${incident.title}</h2>
        
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 18px; color: #065f46; font-weight: bold;">✅ This incident has been resolved!</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 16px; color: #374151;">${incident.message}</p>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Service:</td>
              <td style="padding: 10px 0; color: #111827;">${serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Status:</td>
              <td style="padding: 10px 0;">
                <span style="background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                  Resolved
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #6b7280; font-weight: bold;">Resolved:</td>
              <td style="padding: 10px 0; color: #111827;">${incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3001'}/status/${incident.userId}" 
             style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            View Status Page
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>This is an automated notification from your Status Page system.</p>
          <p>You received this email because an incident was resolved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send email function
const sendEmail = async (to, subject, html, text) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('Email not configured. Skipping email send.');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Status Page'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || subject, // Plain text fallback
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send incident created email
const sendIncidentCreatedEmail = async (incident, serviceName, userEmail, userName) => {
  const subject = `⚠️ New Incident: ${incident.title}`;
  const html = getIncidentCreatedTemplate(incident, serviceName, userName);
  const text = `New Incident: ${incident.title}\n\nService: ${serviceName}\nStatus: ${incident.status}\n\n${incident.message}`;
  
  return await sendEmail(userEmail, subject, html, text);
};

// Send incident updated email
const sendIncidentUpdatedEmail = async (incident, serviceName, userEmail, userName, oldStatus) => {
  const subject = `📢 Incident Update: ${incident.title}`;
  const html = getIncidentUpdatedTemplate(incident, serviceName, userName, oldStatus);
  const text = `Incident Update: ${incident.title}\n\nService: ${serviceName}\nStatus: ${oldStatus} → ${incident.status}\n\n${incident.message}`;
  
  return await sendEmail(userEmail, subject, html, text);
};

// Send incident resolved email
const sendIncidentResolvedEmail = async (incident, serviceName, userEmail, userName) => {
  const subject = `✅ Incident Resolved: ${incident.title}`;
  const html = getIncidentResolvedTemplate(incident, serviceName, userName);
  const text = `Incident Resolved: ${incident.title}\n\nService: ${serviceName}\n\n${incident.message}\n\nThis incident has been resolved.`;
  
  return await sendEmail(userEmail, subject, html, text);
};

module.exports = {
  sendEmail,
  sendIncidentCreatedEmail,
  sendIncidentUpdatedEmail,
  sendIncidentResolvedEmail,
};

