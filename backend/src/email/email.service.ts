import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class EmailService {
  private readonly brevoApiKey: string
  private readonly brevoBaseUrl: string
  private readonly senderEmail: string
  private readonly senderName: string
  private readonly timeoutMs: number

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService
  ) {
    this.brevoApiKey = this.config.get<string>('BREVO_API_KEY') ?? ''
    this.brevoBaseUrl = (this.config.get<string>('BREVO_BASE_URL') ?? 'https://api.brevo.com').replace(
      /\/+$/,
      ''
    )
    this.senderEmail = this.config.get<string>('BREVO_SENDER_EMAIL') ?? 'no-reply@maternix.local'
    this.senderName = this.config.get<string>('BREVO_SENDER_NAME') ?? 'Maternix Track'
    this.timeoutMs = Number(this.config.get<string>('BREVO_TIMEOUT_MS') ?? 10000)
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
      await this.sendViaBrevo({ to, subject, html, text })

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

  private async sendViaBrevo(payload: { to: string; subject: string; html: string; text?: string }) {
    if (!this.brevoApiKey) {
      throw new Error('Brevo API key is not configured. Set BREVO_API_KEY.')
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const response = await fetch(`${this.brevoBaseUrl}/v3/smtp/email`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': this.brevoApiKey,
        },
        body: JSON.stringify({
          sender: {
            email: this.senderEmail,
            name: this.senderName,
          },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.html,
          textContent: payload.text,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const responseText = await response.text()
        const details = this.extractBrevoErrorMessage(responseText)
        throw new Error(`Brevo API error (${response.status}): ${details}`)
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Brevo request timeout')
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  private extractBrevoErrorMessage(rawBody: string) {
    if (!rawBody) return 'Unknown Brevo error'
    try {
      const parsed = JSON.parse(rawBody) as { message?: string; code?: string }
      return parsed.message ?? parsed.code ?? rawBody
    } catch {
      return rawBody
    }
  }

  private toPublicMessage(errorMessage: string) {
    const lowerError = errorMessage.toLowerCase()

    if (lowerError.includes('401') || lowerError.includes('403') || lowerError.includes('unauthorized')) {
      return 'Email sending failed: Brevo API authentication failed. Check BREVO_API_KEY.'
    }
    if (lowerError.includes('400') || lowerError.includes('422')) {
      return 'Email sending failed: Brevo rejected the payload. Check sender/recipient email and message content.'
    }
    if (
      lowerError.includes('timeout') ||
      lowerError.includes('aborterror') ||
      lowerError.includes('fetch failed') ||
      lowerError.includes('network')
    ) {
      return 'Email sending failed: Brevo service unreachable or timed out.'
    }

    return `Email sending failed: ${errorMessage}`
  }
}
