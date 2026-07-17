import { Injectable, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../config/env.validation';

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: nodemailer.Transporter<SESTransport.SentMessageInfo>;
  private senderEmail!: string;

  constructor(
    private configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  onModuleInit() {
    const region = this.configService.get('AWS_REGION', { infer: true });
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID', {
      infer: true,
    });
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY', {
      infer: true,
    });

    this.senderEmail = this.configService.get('SENDER_EMAIL', { infer: true });

    const sesClient = new SESv2Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    });
  }

  /**
   * Sends an email and returns the official SES SentMessageInfo structure
   */
  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: nodemailer.SendMailOptions['attachments'];
  }): Promise<SESTransport.SentMessageInfo> {
    const info = await this.transporter.sendMail({
      from: this.senderEmail,
      ...options,
    });

    return info;
  }
}
