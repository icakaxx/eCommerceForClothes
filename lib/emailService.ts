import { sendEmail, getContactEmail, isEmailConfigured } from '@/lib/mail'

interface EmailOptions {
  to: string
  name: string
}

interface PasswordResetEmailOptions {
  to: string
  name: string
  resetToken: string
  resetUrl: string
}

export class EmailService {
  async sendWelcomeEmail({ to, name }: EmailOptions): Promise<void> {
    if (!isEmailConfigured()) {
      return
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const storeName = process.env.RESEND_FROM_NAME || process.env.NEXT_PUBLIC_STORE_NAME || 'Store'

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Добре дошли в ${storeName}!</title>
        <style>
          body {
            font-family: Inter, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .welcome-title {
            color: #2563eb;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .welcome-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #666;
          }
          .shop-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 14px;
          }
          .highlight {
            color: #2563eb;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h1 class="welcome-title">Добре дошли в ${storeName}!</h1>
          <p class="welcome-text">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Радваме се, че се присъединихте към нас!<br>
            Сега можете да пазарувате от нашия онлайн магазин.
          </p>
          <div style="text-align: center;">
            <a href="${siteUrl}" class="shop-button">
              ПАЗАРУВАЙ СЕГА
            </a>
          </div>
          <p class="welcome-text">
            Благодарим ви за доверието!
          </p>
          <div class="footer">
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© ${new Date().getFullYear()} ${storeName}. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      await sendEmail({
        to,
        subject: `Добре дошли в ${storeName}!`,
        html: htmlContent,
        replyTo: getContactEmail(),
      })
    } catch (error) {
      console.error('Error sending welcome email:', error)
    }
  }

  async sendPasswordResetEmail({ to, name, resetToken, resetUrl }: PasswordResetEmailOptions): Promise<void> {
    if (!isEmailConfigured()) {
      return
    }

    const storeName = process.env.RESEND_FROM_NAME || process.env.NEXT_PUBLIC_STORE_NAME || 'Store'

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="bg">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Възстановяване на парола - ${storeName}</title>
        <style>
          body {
            font-family: Inter, system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .email-container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .reset-title {
            color: #2563eb;
            font-size: 28px;
            font-weight: 800;
            text-align: center;
            margin-bottom: 20px;
          }
          .reset-text {
            font-size: 16px;
            text-align: center;
            margin-bottom: 30px;
            color: #666;
          }
          .reset-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 18px 35px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            margin: 20px auto;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #666;
            font-size: 14px;
          }
          .highlight {
            color: #2563eb;
            font-weight: 700;
          }
          .warning {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            color: #dc2626;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <h1 class="reset-title">Възстановяване на парола 🔐</h1>
          <p class="reset-text">
            Здравейте, <span class="highlight">${name}</span>!<br><br>
            Получихме заявка за възстановяване на паролата на вашия акаунт.
          </p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">
              ВЪЗСТАНОВИ ПАРОЛАТА
            </a>
          </div>
          <div class="warning">
            <strong>⚠️ Важно:</strong><br>
            Този линк е валиден само 1 час.<br>
            Ако не сте вие заявили възстановяването, моля игнорирайте този имейл.
          </div>
          <p class="reset-text">
            Ако имате проблеми с бутона, копирайте този линк в браузъра:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all; font-weight: 700;">${resetUrl}</a>
          </p>
          <div class="footer">
            <p>Този имейл е изпратен автоматично. Моля, не отговаряйте на него.</p>
            <p>© ${new Date().getFullYear()} ${storeName}. Всички права запазени.</p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      await sendEmail({
        to,
        subject: `Възстановяване на парола - ${storeName} 🔐`,
        html: htmlContent,
        replyTo: getContactEmail(),
      })
    } catch (error) {
      console.error('Error sending password reset email:', error)
    }
  }
}

export const emailService = new EmailService()
