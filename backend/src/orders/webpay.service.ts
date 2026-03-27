import { Injectable } from '@nestjs/common';
import {
  WebpayPlus,
  Options,
  IntegrationApiKeys,
  Environment,
  IntegrationCommerceCodes,
} from 'transbank-sdk';

@Injectable()
export class WebpayService {
  private tx: InstanceType<typeof WebpayPlus.Transaction>;

  constructor() {
    this.tx = new WebpayPlus.Transaction(
      new Options(
        IntegrationCommerceCodes.WEBPAY_PLUS,
        IntegrationApiKeys.WEBPAY,
        Environment.Integration,
      ),
    );
  }

  async create(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string,
  ): Promise<any> {
    // Agregamos 'await' y limpiamos el disable que sobraba
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await (this.tx as any).create(
      buyOrder,
      sessionId,
      amount,
      returnUrl,
    );
  }

  async commit(token: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    return await (this.tx as any).commit(token);
  }
}
