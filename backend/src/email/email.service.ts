import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter
  private readonly fromAddress: string

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService
  ) {
    const host = this.config.get<string>('SMTP_HOST')
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587)
    const secure = this.config.get<string>('SMTP_SECURE') === 'true'
    const rejectUnauthorized = this.config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED')

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: rejectUnauthorized !== 'false',
      },
    })

    this.fromAddress =
      this.config.get<string>('EMAIL_FROM') ??
      this.config.get<string>('SMTP_USER') ??
      'no-reply@maternix.local'
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    template: string,
    text?: string
  ) {
    const db = this.supabase.getServiceClient()

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text,
      })

      await db
        .from('email_logs')
        .insert({ to_email: to, subject, template, status: 'sent' })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      await db.from('email_logs').insert({
        to_email: to,
        subject,
        template,
        status: 'failed',
        error_message: errorMessage,
      })
      throw new InternalServerErrorException(this.toPublicMessage(errorMessage))
    }
  }

  private toPublicMessage(errorMessage: string) {
    const lowerError = errorMessage.toLowerCase()

    if (lowerError.includes('invalid login') || lowerError.includes('badcredentials')) {
      return 'Email sending failed: SMTP login rejected. Check SMTP_USER and SMTP_PASS.'
    }
    if (lowerError.includes('self-signed certificate')) {
      return 'Email sending failed: TLS certificate validation error. Set SMTP_TLS_REJECT_UNAUTHORIZED=false only for trusted local testing.'
    }

    return `Email sending failed: ${errorMessage}`
  }
}
