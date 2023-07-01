import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface MailOptions {
  service: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class SendMail {
  private transporter: nodemailer.Transporter;

  constructor(options: MailOptions) {
    this.transporter = nodemailer.createTransport(options);
  }

  execute = async (mailOption: Mail.Options) => {
    try {
      return await this.transporter.sendMail(mailOption);
    } catch (error) {
      throw error;
    }
  };
}
