import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { escapeHtml } from '../utils/html';

// Se manda por la API HTTP de Brevo (puerto 443) en vez de SMTP (puerto 587):
// DigitalOcean (y proveedores similares) puede restringir el puerto de SMTP
// saliente ante actividad sospechosa, dejando el envio de correos colgado
// hasta el timeout. La API HTTP usa el mismo puerto que el resto del trafico
// web, que nunca se bloquea.
@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  private async sendViaBrevoApi(params: {
    toEmail: string;
    toName: string;
    subject: string;
    html: string;
  }) {
    const apiKey = this.configService.getOrThrow<string>('BREVO_API_KEY');
    const fromRaw = this.configService.get<string>(
      'SMTP_FROM',
      'lajambre.contacto@gmail.com',
    );
    const fromEmail = fromRaw.replace(/^.*<(.+)>$/, '$1').trim();

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'Lajambre', email: fromEmail },
        to: [{ email: params.toEmail, name: params.toName }],
        subject: params.subject,
        htmlContent: params.html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new InternalServerErrorException(
        `Brevo API error (${response.status}): ${errorBody}`,
      );
    }
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

    const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verifica tu cuenta en Lajambre</title>
        </head>
        <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                  <!-- Header -->
                  <tr>
                    <td align="center" style="background-color:#0a0a0a; padding:36px 24px;">
                      <div style="font-size:44px; line-height:1; margin-bottom:10px;">🍔</div>
                      <div style="color:#EAB308; font-size:22px; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Lajambre</div>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 32px 8px 32px; text-align:center;">
                      <h1 style="margin:0 0 12px 0; color:#0a0a0a; font-size:22px; font-weight:800; text-transform:uppercase;">
                        ¡Bienvenido, ${escapeHtml(userName)}!
                      </h1>
                      <p style="margin:0; color:#6b6b6b; font-size:15px; line-height:1.6;">
                        Ya casi estamos listos. Confirmá que este correo es tuyo para empezar a acumular puntos en Lajambre Club.
                      </p>
                    </td>
                  </tr>

                  <!-- CTA -->
                  <tr>
                    <td align="center" style="padding:28px 32px;">
                      <a href="${url}" style="display:inline-block; background-color:#EAB308; color:#0a0a0a; padding:16px 40px; text-decoration:none; font-weight:800; font-size:14px; letter-spacing:1px; border-radius:12px; text-transform:uppercase;">
                        Verificar mi cuenta
                      </a>
                    </td>
                  </tr>

                  <!-- Fallback link -->
                  <tr>
                    <td style="padding:0 32px 32px 32px; text-align:center;">
                      <p style="margin:0; color:#a3a3a3; font-size:12px; line-height:1.6;">
                        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br>
                        <a href="${url}" style="color:#EAB308; word-break:break-all;">${url}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 32px; background-color:#fafafa; border-top:1px solid #eeeeee; text-align:center;">
                      <p style="margin:0; color:#a3a3a3; font-size:11px; line-height:1.6;">
                        Si no creaste esta cuenta, podés ignorar este correo.<br>
                        &copy; ${new Date().getFullYear()} Lajambre · Para que tengas ganas de un gustito.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

    await this.sendViaBrevoApi({
      toEmail: userEmail,
      toName: userName,
      subject: '🍔 Verifica tu cuenta en Lajambre',
      html,
    });
  }
}
