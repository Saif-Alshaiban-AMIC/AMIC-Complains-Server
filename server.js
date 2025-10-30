const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


const upload = multer({ storage: multer.memoryStorage() });


const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

app.get('/', (req, res) => {
  res.json({ message: 'Email server is running!' });
});


app.post('/api/sendEmail', async (req, res) => {
  console.log('📧 Received email request');
  console.log('To:', req.body.to);
  console.log('Subject:', req.body.subject);
  console.log('Attachments:', req.body.attachments?.length || 0);

  try {
    const { to, subject, body, attachments } = req.body;


    if (!to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, body' 
      });
    }

    
    const transporter = createTransporter();

  
    const emailAttachments = attachments?.map(att => ({
      filename: att.filename,
      content: Buffer.from(att.content, 'base64'),
      contentType: att.contentType
    })) || [];

  
    const mailOptions = {
      from: `"Speak Safe AMIC" <${process.env.SMTP_USER}>`,
      to: "salshaiban@alkhorayef.com",
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      attachments: emailAttachments
    };

  
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
});


app.post('/api/testEmail', async (req, res) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, 
      subject: 'Test Email from Speak Safe AMIC',
      text: 'This is a test email. If you received this, your email server is working!',
      html: '<h1>Test Email</h1><p>This is a test email. If you received this, your email server is working!</p>'
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Test email sent!');
    console.log('Message ID:', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/sendEmail`);
  console.log(`🧪 Test email: POST to http://localhost:${PORT}/api/testEmail`);
});