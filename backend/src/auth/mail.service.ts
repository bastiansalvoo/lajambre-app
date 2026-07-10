import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(
    userEmail: string,
    token: string,
    userName: string,
  ) {
    const apiBaseUrl = this.configService.get<string>('API_BASE_URL');
    const host = this.configService.get<string>('API_HOST', 'localhost');
    const port = this.configService.get<string>('PORT', '3000');
    const baseUrl = apiBaseUrl || `http://${host}:${port}`;
    const url = `${baseUrl}/auth/verify?token=${token}`;

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM', '"Lajambre" <lajambre.contacto@gmail.com>'),
      to: userEmail,
      subject: '🍔 Verifica tu cuenta en Lajambre',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px; text-align: center;">
          <h1 style="color: #EAB308; text-transform: uppercase;">¡Bienvenido a Lajambre, ${userName}!</h1>
          <p style="font-size: 16px; color: #a3a3a3;">Ya casi estamos listos. Solo necesitamos confirmar que este correo es tuyo.</p>
          
          <a href="${url}" style="display: inline-block; background-color: #EAB308; color: #000000; padding: 15px 30px; margin: 20px 0; text-decoration: none; font-weight: bold; border-radius: 10px; text-transform: uppercase;">
            Verificar mi cuenta
          </a>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
