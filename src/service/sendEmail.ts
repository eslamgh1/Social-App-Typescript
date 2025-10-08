import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";


export const  sendEmail= async (mailOptions: Mail.Options)=>{
// Create a test account or replace with real credentials.
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.USER_EMAIL, // generated ethereal user
    pass: process.env.USER_PASSWORD, // generated ethereal password
  },
});

  const info =  await transporter.sendMail({
    from: `"SocialMediaApp" ${process.env.USER_EMAIL}`, // sender address 
    ...mailOptions

  });

  // console.log("Message sent:", info.messageId);
}

export const generateOTP = async ()=>{
  return Math.floor(Math.random() *( 999999-100000 +1 ) + 100000)
}

console.log(generateOTP());