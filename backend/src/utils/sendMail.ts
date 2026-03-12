import nodemailer from "nodemailer";

type email = {
  email: string;
  subject: string;
  html: string;
}

export const sendMail = async({email, subject, html}: email) => {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    }
  });
  
  await transport.sendMail({
    from : "From mern auth <no-reply>",
    to: email,
    subject,
    html
  })
}