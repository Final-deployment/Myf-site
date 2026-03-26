const nodemailer = require('nodemailer');

// Configure Nodemailer transporter for Gmail with timeouts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  // CRITICAL: Add timeouts to prevent server hanging on SMTP issues
  connectionTimeout: 10000, // 10 seconds to establish connection
  greetingTimeout: 10000,   // 10 seconds for greeting
  socketTimeout: 15000      // 15 seconds for the entire operation
});

// Log warning if no credentials
if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('[EMAIL] SMTP credentials not configured. Email sending will fail/simulate.');
}

/**
 * Generate a 6-digit OTP code
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send verification email with OTP
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP code
 */
async function sendVerificationEmail(email, name, otp) {
  try {
    // If SMTP is not configured, simulate sending
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULATION] Would send OTP ${otp} to ${email}`);
      return { success: true, data: { simulated: true, otp } };
    }

    const fromName = process.env.SMTP_FROM_NAME || "المصطبة العلمية";
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'رمز التحقق من بريدك الإلكتروني - المصطبة العلمية',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4a045; margin: 0; font-size: 28px;">المصطبة العلمية</h1>
            <p style="color: #a7f3d0; margin: 10px 0 0 0;">Scientific Bench</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 20px 0;">أهلاً ${name}!</h2>
            <p style="color: #d1fae5; font-size: 16px; line-height: 1.6;">
              شكراً لتسجيلك في المصطبة العلمية. لإكمال التسجيل، يرجى إدخال رمز التحقق التالي:
            </p>
            
            <div style="background: #064e3b; border: 2px solid #d4a045; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #d4a045; letter-spacing: 8px;">${otp}</span>
            </div>
            
            <p style="color: #a7f3d0; font-size: 14px;">
              هذا الرمز صالح لمدة <strong>10 دقائق</strong> فقط.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6ee7b7; font-size: 12px;">
            <p>إذا لم تقم بطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.</p>
            <p style="margin-top: 20px;">© 2024 Muslim Youth Forum - المصطبة العلمية</p>
          </div>
        </div>
      `
    });


    console.log('Verification email sent:', info.messageId);
    return { success: true, data: info };
  } catch (err) {
    console.error('Email service error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send password to user's email (Forgot Password)
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} newPassword - The new generated password
 */
async function sendPasswordEmail(email, name, newPassword) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULATION] Would send new password to ${email}`);
      return { success: true, data: { simulated: true } };
    }

    const fromName = process.env.SMTP_FROM_NAME || "المصطبة العلمية";
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'استعادة كلمة المرور - المصطبة العلمية',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4a045; margin: 0; font-size: 28px;">المصطبة العلمية</h1>
            <p style="color: #a7f3d0; margin: 10px 0 0 0;">Scientific Bench</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 20px 0;">أهلاً ${name}!</h2>
            <p style="color: #d1fae5; font-size: 16px; line-height: 1.6;">
              تم إعادة تعيين كلمة المرور الخاصة بك. يمكنك استخدام كلمة المرور الجديدة التالية لتسجيل الدخول:
            </p>
            
            <div style="background: #064e3b; border: 2px solid #d4a045; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <span style="font-size: 28px; font-weight: bold; color: #d4a045; letter-spacing: 4px;">${newPassword}</span>
            </div>
            
            <p style="color: #fbbf24; font-size: 14px; font-weight: bold;">
              ⚠️ ننصحك بشدة بتغيير كلمة المرور فور تسجيل الدخول من خلال الإعدادات.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6ee7b7; font-size: 12px;">
            <p>إذا لم تقم بطلب استعادة كلمة المرور، يرجى التواصل مع الإدارة فوراً.</p>
            <p style="margin-top: 20px;">© 2024 Muslim Youth Forum - المصطبة العلمية</p>
          </div>
        </div>
      `
    });

    console.log('Password email sent:', info.messageId);
    return { success: true, data: info };
  } catch (err) {
    console.error('Password email service error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send approval notification email to student
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 */
async function sendApprovalNotificationEmail(email, name) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULATION] Would send approval notification to ${email}`);
      return { success: true, data: { simulated: true } };
    }

    const fromName = process.env.SMTP_FROM_NAME || "المصطبة العلمية";
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'تمت الموافقة على طلب انتسابك - المصطبة العلمية',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4a045; margin: 0; font-size: 28px;">المصطبة العلمية</h1>
            <p style="color: #a7f3d0; margin: 10px 0 0 0;">Scientific Bench</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
            <h2 style="color: #ffffff; margin: 0 0 20px 0;">مبارك ${name}!</h2>
            <p style="color: #d1fae5; font-size: 16px; line-height: 1.8;">
              تمت الموافقة على طلب انتسابك في المصطبة العلمية.<br/>
              يمكنك الآن تسجيل الدخول والبدء في رحلتك التعليمية.
            </p>
            
            <div style="background: #064e3b; border: 2px solid #10b981; border-radius: 12px; padding: 15px; margin: 25px 0;">
              <span style="font-size: 18px; color: #10b981;">✅ تمت الموافقة على حسابك</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6ee7b7; font-size: 12px;">
            <p style="margin-top: 20px;">© 2024 Muslim Youth Forum - المصطبة العلمية</p>
          </div>
        </div>
      `
    });

    console.log('Approval notification email sent:', info.messageId);
    return { success: true, data: info };
  } catch (err) {
    console.error('Approval notification email error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send rejection notification email to student
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} reason - Rejection reason
 */
async function sendRejectionNotificationEmail(email, name, reason) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[EMAIL SIMULATION] Would send rejection notification to ${email}`);
      return { success: true, data: { simulated: true } };
    }

    const fromName = process.env.SMTP_FROM_NAME || "المصطبة العلمية";
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'بخصوص طلب انتسابك - المصطبة العلمية',
      html: `
        <div dir="rtl" style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #064e3b 0%, #022c22 100%); border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4a045; margin: 0; font-size: 28px;">المصطبة العلمية</h1>
            <p style="color: #a7f3d0; margin: 10px 0 0 0;">Scientific Bench</p>
          </div>
          
          <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0 0 20px 0;">عزيزي/عزيزتي ${name}</h2>
            <p style="color: #d1fae5; font-size: 16px; line-height: 1.8;">
              نأسف لإبلاغك بأنه لم تتم الموافقة على طلب انتسابك في الوقت الحالي.
            </p>
            ${reason ? `
            <div style="background: #064e3b; border: 2px solid #f59e0b; border-radius: 12px; padding: 15px; margin: 25px 0;">
              <p style="color: #fbbf24; font-size: 14px; margin: 0;">السبب: ${reason}</p>
            </div>
            ` : ''}
            <p style="color: #a7f3d0; font-size: 14px;">
              يمكنك إعادة التسجيل أو التواصل مع الإدارة للمزيد من التفاصيل.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6ee7b7; font-size: 12px;">
            <p style="margin-top: 20px;">© 2024 Muslim Youth Forum - المصطبة العلمية</p>
          </div>
        </div>
      `
    });

    console.log('Rejection notification email sent:', info.messageId);
    return { success: true, data: info };
  } catch (err) {
    console.error('Rejection notification email error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  generateOTP,
  sendVerificationEmail,
  sendPasswordEmail,
  sendApprovalNotificationEmail,
  sendRejectionNotificationEmail
};
