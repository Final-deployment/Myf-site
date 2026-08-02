const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'mastaba.mastaba123@gmail.com',
    pass: 'atrcsxodkntycmlj'
  }
});

transporter.sendMail({
  from: '"Al-Mastaba" <mastaba.mastaba123@gmail.com>',
  to: 'mastaba.mastaba123@gmail.com',
  subject: 'Test - Verification Code',
  html: '<div style="text-align:center"><h1>Test Email</h1><h2 style="color:#d4a045; letter-spacing:8px">123456</h2><p>This is a test email to verify SMTP works</p></div>'
}).then(info => {
  console.log('EMAIL SENT SUCCESSFULLY! MessageId:', info.messageId);
  process.exit(0);
}).catch(err => {
  console.error('SEND FAILED:', err.message);
  process.exit(1);
});
