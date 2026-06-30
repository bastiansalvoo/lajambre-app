import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADOPAGO_ACCESS_TOKEN');
    this.client = new MercadoPagoConfig({
      accessToken: accessToken || '',
    });
  }

  /**
   * Crea una preferencia de pago (Checkout Pro) en Mercado Pago.
   * Devuelve init_point (producción) o sandbox_init_point (pruebas).
   */
  async createPreference(params: {
    orderId: number;
    items: { title: string; quantity: number; unit_price: number }[];
    payer: { email: string };
    backUrls: { success: string; failure: string; pending: string };
    externalReference: string;
  }): Promise<{ init_point: string; sandbox_init_point: string; preferenceId: string }> {
    const preference = new Preference(this.client);

    const response = await preference.create({
      body: {
        items: params.items.map((item) => ({
          id: String(params.orderId),
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          currency_id: 'CLP',
        })),
        payer: {
          email: params.payer.email,
        },
        back_urls: {
          success: params.backUrls.success,
          failure: params.backUrls.failure,
          pending: params.backUrls.pending,
        },
        external_reference: params.externalReference,
        statement_descriptor: 'La Jambre',
      },
    });

    return {
      init_point: response.init_point || '',
      sandbox_init_point: response.sandbox_init_point || '',
      preferenceId: response.id || '',
    };
  }

  /**
   * Obtiene los detalles de un pago específico por su ID.
   * Usado para verificar el estado al recibir la notificación de retorno.
   */
  async getPayment(paymentId: string): Promise<{ status: string; external_reference: string }> {
    const payment = new Payment(this.client);
    const result = await payment.get({ id: paymentId });
    return {
      status: result.status || 'unknown',
      external_reference: result.external_reference || '',
    };
  }
}
