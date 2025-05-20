const mailer =require('nodemailer')
require('dotenv').config();

const transport=mailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})
const sendVerificationEmail = (email, token) => {
    const link = `http://localhost:3000/auth/verify/${token}`;
  
    return transport.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `
  <p>Click the link below to verify your email:</p>
  <a href="${link}">${link}</a>
  <p>If you can't click the link, copy and paste it into your browser.</p>
`

    });
  };
  
  module.exports = sendVerificationEmail;
