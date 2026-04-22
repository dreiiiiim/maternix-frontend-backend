import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: Number(this.config.get('SMTP_PORT')),
      secure: this.config.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    })
  }

  async sendEmail(to: string, subject: string, html: string, template: string) {
    const db = this.supabase.getServiceClient()

    try {
      await this.transporter.sendMail({
        from: this.config.get('EMAIL_FROM'),
        to,
        subject,
        html,
      })

      await db
        .from('email_logs')
        .insert({ to_email: to, subject, template, status: 'sent' })
    } catch (err) {
      await db.from('email_logs').insert({
        to_email: to,
        subject,
        template,
        status: 'failed',
        error_message: err instanceof Error ? err.message : String(err),
      })
      throw new InternalServerErrorException('Failed to send email')
    }
  }
}
