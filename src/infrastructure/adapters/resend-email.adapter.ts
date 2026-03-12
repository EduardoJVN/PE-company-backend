import { Resend } from 'resend';
import type { IEmailSender, SendEmailOptions } from '@domain/ports/email-sender.port.js';

export class ResendEmailAdapter implements IEmailSender {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.client.emails.send({
      from: this.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}
