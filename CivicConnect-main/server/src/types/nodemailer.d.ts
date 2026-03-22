declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to?: string;
    subject?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<unknown>;
  }

  export interface TransportOptions {
    host: string;
    port: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  const nodemailer: {
    createTransport(options: TransportOptions): Transporter;
  };

  export default nodemailer;
}
