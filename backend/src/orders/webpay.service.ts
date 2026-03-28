import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebpayPlus, Options, Environment } from 'transbank-sdk';

@Injectable()
export class WebpayService {
  private tx: InstanceType<typeof WebpayPlus.Transaction>;

  constructor(private configService: ConfigService) {
    const commerceCode =
      this.configService.get<string>('WEBPAY_COMMERCE_CODE') || '597055555532';
    const apiKey =
      this.configService.get<string>('WEBPAY_API_KEY') ||
      '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C';

    const envSetting = this.configService.get<string>('WEBPAY_ENVIRONMENT');
    const environment =
      envSetting === 'Production'
        ? Environment.Production
        : Environment.Integration;

    this.tx = new WebpayPlus.Transaction(
      new Options(commerceCode, apiKey, environment),
    );
  }

  async create(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string,
  ): Promise<any> {
    // Usamos una firma de función más específica para evitar el error de ESLint
    const transaction = this.tx as unknown as {
      create: (...args: any[]) => Promise<any>;
    };
    return await transaction.create(buyOrder, sessionId, amount, returnUrl);
  }

  async commit(token: string): Promise<any> {
    const transaction = this.tx as unknown as {
      commit: (...args: any[]) => Promise<any>;
    };
    return await transaction.commit(token);
  }
}
