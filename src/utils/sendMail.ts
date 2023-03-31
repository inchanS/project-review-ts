import nodemailer from 'nodemailer';

// FIXME : any 타입 제거
export const sendMail = (mailOption: any) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOption, (error, info) => {
      if (error) {
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};
