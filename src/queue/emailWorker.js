const nodemailer = require('nodemailer');
require('dotenv').config()

console.log(process.env.EMAIL_USER)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // or your SMTP server IP address
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false
    }
});

const sendEmail = async (propsData) => {
    const { emailTo, OTP } = propsData
  
    try {
      await transporter.sendMail(  {   
        from: `No Reply ${process.env.EMAIL_USER}`,
        to: emailTo,
        subject: 'Thông báo mã OTP thay đổi mật khẩu ',
        html: `
        <div style="padding: 10px; background-color: #003375">
            <div style="padding: 10px; background-color: white;">
                <h2 style="color: #0085ff">Mã OTP của bản là : ${OTP} </h2>
            </div>
        </div>
    `
    });
    } catch (error) {
      console.error('Error sending email:', error.message);
      throw error;
    }
  };
  
  module.exports = sendEmail;