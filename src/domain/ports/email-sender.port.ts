export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface IEmailSender {
  send(options: SendEmailOptions): Promise<void>;
}
