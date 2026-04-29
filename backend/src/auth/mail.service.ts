import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // <-- La librería que acabas de instalar

@Injectable()
export class MailService {
  // 👇 Le decimos explícitamente a TypeScript qué tipo de dato es esto
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'dev.lajambre@gmail.com',
        pass: 'xzyfzfirwzxpxljq', // La que generaste en Google
      },
    });
  }

  async sendVerificationEmail(
    userEmail: string,
    token: string,
    userName: string,
  ) {
    const url = `http://192.168.1.14:3000/auth/verify?token=${token}`;

    const mailOptions = {
      from: '"La Jambre App" <no-reply@lajambre.cl>',
      to: userEmail,
      subject: '🍔 Verifica tu cuenta en La Jambre',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 40px; text-align: center;">
          <h1 style="color: #EAB308; text-transform: uppercase;">¡Bienvenido a La Jambre, ${userName}!</h1>
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
