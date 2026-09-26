import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import SESTransport from 'nodemailer/lib/ses-transport';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from 'src/config/env.config';
import { compile } from 'handlebars';
import * as fs from 'fs/promises';
import { join } from 'path';
import { WhiteLabel } from 'src/generated/prisma/client';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter!: nodemailer.Transporter<SESTransport.SentMessageInfo>;
  private senderEmail!: string;
  private platformUrl!: string;

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
    // Trailing slashes are stripped so the link builders below can always
    // concatenate with a single leading slash.
    this.platformUrl = this.configService
      .get('PLATFORM_URL', { infer: true })
      .replace(/\/+$/, '');

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
    const verificationUrl = `${this.platformUrl}/auth/verify?token=${token}`;

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
    const resetUrl = `${this.platformUrl}/auth/password-reset?token=${token}`;

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

  /**
   * Resolves the WhiteLabel tenant's dedicated SES transporter, sender address,
   * portal domain, and brand styling context.
   */
  private resolveWhiteLabelContext(whiteLabel: WhiteLabel) {
    // 1. Resolve portal URL (prefer custom domain, fallback to platform subdomain or platform URL)
    let portalUrl = this.platformUrl;
    if (whiteLabel.customDomain && whiteLabel.customDomain.trim() !== '') {
      const cleanDomain = whiteLabel.customDomain
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');
      portalUrl = `https://${cleanDomain}`;
    } else if (whiteLabel.subdomain && whiteLabel.subdomain.trim() !== '') {
      portalUrl = `https://${whiteLabel.subdomain.trim()}.platform.royalmotionit.com`;
    }

    // 2. Resolve sender address
    let senderEmail = this.senderEmail;
    if (whiteLabel.senderEmail && whiteLabel.senderEmail.trim() !== '') {
      senderEmail = whiteLabel.senderEmail.trim().toLowerCase();
    } else if (whiteLabel.customDomain && whiteLabel.customDomain.trim() !== '') {
      const cleanDomain = whiteLabel.customDomain
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');
      senderEmail = `noreply@${cleanDomain}`;
    }

    const brandName = whiteLabel.name?.trim() || 'Music Portal';
    const fromHeader = `"${brandName}" <${senderEmail}>`;

    // 3. Resolve dedicated or platform SES transporter
    let transporter = this.transporter;
    if (
      whiteLabel.awsAccessKeyId &&
      whiteLabel.awsSecretAccessKey &&
      whiteLabel.awsAccessKeyId.trim() !== '' &&
      whiteLabel.awsSecretAccessKey.trim() !== ''
    ) {
      try {
        const sesClient = new SESv2Client({
          region: whiteLabel.awsRegion?.trim() || 'ap-southeast-1',
          credentials: {
            accessKeyId: whiteLabel.awsAccessKeyId.trim(),
            secretAccessKey: whiteLabel.awsSecretAccessKey.trim(),
          },
        });
        transporter = nodemailer.createTransport({
          SES: { sesClient, SendEmailCommand },
        });
      } catch (err) {
        this.logger.warn(
          `[MailService] Failed to initialize dedicated SES transporter for tenant ${whiteLabel.id}: ${err}`,
        );
      }
    }

    return {
      portalUrl,
      senderEmail,
      fromHeader,
      transporter,
      brandName,
      logoUrl: whiteLabel.logoUrl || null,
      primaryColor: whiteLabel.primaryColor || '#6366f1',
      supportEmail: whiteLabel.supportEmail || null,
      copyrightText:
        whiteLabel.copyrightText ||
        `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
    };
  }

  /**
   * Resilient send helper that uses tenant transporter with fallback to platform SES
   */
  private async sendWithFallback(
    transporter: nodemailer.Transporter<SESTransport.SentMessageInfo>,
    mailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
    },
  ): Promise<SESTransport.SentMessageInfo> {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (primaryErr) {
      this.logger.warn(
        `[MailService] Delivery attempt failed from ${mailOptions.from}: ${primaryErr}. Retrying with platform transporter.`,
      );
      try {
        return await this.transporter.sendMail(mailOptions);
      } catch (fallbackErr) {
        this.logger.warn(
          `[MailService] Delivery with tenant From header failed: ${fallbackErr}. Retrying with system default sender.`,
        );
        return await this.transporter.sendMail({
          ...mailOptions,
          from: this.senderEmail,
        });
      }
    }
  }

  /**
   * Sends branded account verification email from the WhiteLabel custom domain / SES
   */
  async sendWhiteLabelVerificationEmail(
    whiteLabel: WhiteLabel,
    email: string,
    name: string,
    token: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const ctx = this.resolveWhiteLabelContext(whiteLabel);
    const verificationUrl = `${ctx.portalUrl}/auth/verify?token=${token}`;

    const htmlContent = await this.compileTemplate(
      'whitelabel-email-verification',
      {
        name,
        brandName: ctx.brandName,
        logoUrl: ctx.logoUrl,
        primaryColor: ctx.primaryColor,
        url: verificationUrl,
        supportEmail: ctx.supportEmail,
        copyrightText: ctx.copyrightText,
      },
    );

    return this.sendWithFallback(ctx.transporter, {
      from: ctx.fromHeader,
      to: email,
      subject: `Welcome to ${ctx.brandName}! Please verify your email`,
      html: htmlContent,
    });
  }

  /**
   * Sends branded password reset email from the WhiteLabel custom domain / SES
   */
  async sendWhiteLabelPasswordResetEmail(
    whiteLabel: WhiteLabel,
    email: string,
    name: string,
    token: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const ctx = this.resolveWhiteLabelContext(whiteLabel);
    const resetUrl = `${ctx.portalUrl}/auth/reset-password?token=${token}`;

    const htmlContent = await this.compileTemplate(
      'whitelabel-password-reset',
      {
        name,
        brandName: ctx.brandName,
        logoUrl: ctx.logoUrl,
        primaryColor: ctx.primaryColor,
        resetUrl,
        supportEmail: ctx.supportEmail,
        copyrightText: ctx.copyrightText,
      },
    );

    return this.sendWithFallback(ctx.transporter, {
      from: ctx.fromHeader,
      to: email,
      subject: `Reset your password for ${ctx.brandName}`,
      html: htmlContent,
    });
  }

  /**
   * Sends branded 2FA security challenge email from the WhiteLabel custom domain / SES
   */
  async sendWhiteLabel2faCodeEmail(
    whiteLabel: WhiteLabel,
    email: string,
    name: string,
    code: string,
  ): Promise<SESTransport.SentMessageInfo> {
    const ctx = this.resolveWhiteLabelContext(whiteLabel);

    const htmlContent = await this.compileTemplate('whitelabel-2fa-code', {
      name,
      code,
      brandName: ctx.brandName,
      logoUrl: ctx.logoUrl,
      primaryColor: ctx.primaryColor,
      supportEmail: ctx.supportEmail,
      copyrightText: ctx.copyrightText,
    });

    return this.sendWithFallback(ctx.transporter, {
      from: ctx.fromHeader,
      to: email,
      subject: `${code} is your ${ctx.brandName} authentication code`,
      html: htmlContent,
    });
  }
}

