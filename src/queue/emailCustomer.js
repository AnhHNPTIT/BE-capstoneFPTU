const nodemailer = require('nodemailer');
require('dotenv').config()

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

const sendEmailConsulation = async (propsData) => {
    const { emailCustomer, fullName, phone, note, address } = propsData;
    console.log(emailCustomer, fullName, phone, note, address)

    try {
        await transporter.sendMail({
            from: `${process.env.EMAIL_USER}`,
            to: [emailCustomer, 'tanhaudue@gmail.com'],
            subject: 'Thông tin cần tư vấn của bạn',
            html: `
        <div style="padding: 10px; background-color: #003375">
            <div style="padding: 10px; background-color: white;">
                <h2 style="color: #0085ff"> Họ và tên khách hàng : ${fullName} </h2>
                <h3 style="color: #0085ff"> Số điện thoại khách hàng : ${phone} </h3>
                <h3 style="color: #0085ff"> Ghi chú  : ${note} </h3>
                <h3 style="color: #0085ff"> Địa điểm  : ${address} </h3>
                <h3 style="color: #0085ff"> Chúng tôi sẽ trả lời bạn từ 1 đến 3 ngày </h3>
            </div>
        </div>
    `
        });
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
};

module.exports = sendEmailConsulation;