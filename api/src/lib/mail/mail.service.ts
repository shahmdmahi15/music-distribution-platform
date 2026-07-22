import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';
import { compile } from 'handlebars';
import * as fs from 'fs/promises';
import { join } from 'path';
import { CONSTANTS } from 'src/config/constants.config';

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
      credentials: { accessKeyId, secretAccessKey },
    });

    this.transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand },
    });
  }

  /**
   * Internal helper to load, compile, and merge context data into an HBS file
   */
  private async compileTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): Promise<string> {
    try {
      const templatePath = join(__dirname, 'templates', `${templateName}.hbs`);
      const templateRaw = await fs.readFile(templatePath, 'utf-8');

      // Explicitly type-cast the compiler to a strict signature to stop the 'any' contagion
      const strictCompile = compile as (
        source: string,
      ) => (ctx: Record<string, unknown>) => string;
      const templateDelegate = strictCompile(templateRaw);

      return templateDelegate(context);
    } catch (error) {
      console.error(
        `[MailService] Template compilation failure for "${templateName}":`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to process system communication profiles.',
      );
    }
  }

  /**
   * Sends an account confirmation email using Handlebars layouts
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const verificationUrl = `${CONSTANTS.platform.url}/auth/verify?token=${token}`;

    const htmlContent = await this.compileTemplate(
      'platform-email-verification',
      {
        name: name,
        url: verificationUrl,
      },
    );

    return this.transporter.sendMail({
      from: this.senderEmail,
      to: email,
      subject: 'Welcome! Please verify your email address',
      html: htmlContent,
    });
  }

  /**
   * Sends a 2FA numeric authentication challenge token code to a user
   */
  async send2faCodeEmail(
    email: string,
    name: string,
    code: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const htmlContent = await this.compileTemplate('platform-2fa-code', {
      name: name,
      code: code,
    });

    return this.transporter.sendMail({
      from: this.senderEmail,
      to: email,
      subject: `${code} is your authentication security code`,
      html: htmlContent,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const resetUrl = `${CONSTANTS.platform.url}/auth/password-reset?token=${token}`;

    const htmlContent = await this.compileTemplate('platform-password-reset', {
      name: name,
      resetUrl: resetUrl,
    });

    return this.transporter.sendMail({
      from: this.senderEmail,
      to: email,
      subject: 'Reset Your Password',
      html: htmlContent,
    });
  }

  async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: nodemailer.SendMailOptions['attachments'];
  }): Promise<SESTransport.SentMessageInfo> {
    return this.transporter.sendMail({
      from: this.senderEmail,
      ...options,
    });
  }
}
