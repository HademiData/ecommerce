import {
  HttpException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ProductRecord = {
  id?: string;
  _id?: string;
  name?: string;
  price: string | number;
  isActive: boolean;
};

@Injectable()
export class ProductsClient {
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.baseUrl = (
      config.get<string>('PRODUCT_SERVICE_URL') ??
      'http://localhost:3001'
    ).replace(/\/+$/, '');

    this.secret = config.get<string>('INTERNAL_SERVICE_SECRET') ?? '';

    if (!this.secret) {
      throw new Error('INTERNAL_SERVICE_SECRET is not configured');
    }
  }

  findOne(id: string): Promise<ProductRecord> {
    return this.request<ProductRecord>(
      `/products/${encodeURIComponent(id)}`,
    );
  }

  reserveStockForOrder(
    id: string,
    quantity: number,
    reservationId: string,
  ): Promise<unknown> {
    return this.request(
      `/products/${encodeURIComponent(id)}/reserve-order`,
      {
        method: 'POST',
        body: JSON.stringify({ quantity, reservationId }),
      },
      true,
    );
  }

  releaseStockForOrder(
    id: string,
    quantity: number,
    reservationId: string,
  ): Promise<unknown> {
    return this.request(
      `/products/${encodeURIComponent(id)}/release-order`,
      {
        method: 'POST',
        body: JSON.stringify({ quantity, reservationId }),
      },
      true,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    internal = false,
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string> | undefined),
    };

    if (init.body) {
      headers['Content-Type'] = 'application/json';
    }

    if (internal) {
      headers['x-internal-service-secret'] = this.secret;
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Product Service is unavailable',
      );
    }

    const text = await response.text();
    let result: unknown = text;

    try {
      result = text ? JSON.parse(text) : null;
    } catch {
      // Keep the original response text when it is not JSON.
    }

    if (!response.ok) {
      const payload =
        result && typeof result === 'object'
          ? (result as { message?: unknown })
          : undefined;

      const message =
        typeof payload?.message === 'string'
          ? payload.message
          : `Product Service request failed (${response.status})`;

      throw new HttpException(message, response.status);
    }

    return result as T;
  }
}
