const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const sendEmail = async ({to, cc = [], subject, templateName, replacements = {} ,attachments=[]}) => {
  try {
    console.log("Template Name:", templateName);

    if (!templateName) {
      throw new Error("Template name is required but was not provided");
    }
    if(!to||to.length===0){
      console.warn("sendEmail skipped: No recipient email");
  return;}

    const templatePath = path.join(process.cwd(), 'emailTemplates', templateName);

    console.log("Template Path:", templatePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, replacements[key]??"");
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"Vanced HR" <${process.env.USER_EMAIL}>`,
      to,
      cc,
      subject,
      html: htmlContent,
      attachments: attachments.map(file => {
    return {
      filename: file.originalname || path.basename(file.path),
      path: file.path
    }
  })
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    console.log('Email sent successfully to:', cc);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;

