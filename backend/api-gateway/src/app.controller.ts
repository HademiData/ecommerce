import {
  All,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Controller()
export class AppController {



  @All(['orders', 'orders/*path'])
  orders(@Req() req: Request, @Res() res: Response) {
    return this.forward(
      req,
      res,
      'ORDER_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  @Get('health')
  health() {
    return { status: 'ok' };
  }

  @All(['auth', 'auth/*path'])
  auth(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, 'USER_SERVICE_URL', 'http://localhost:3000');
  }

  @All(['users', 'users/*path'])
  users(@Req() req: Request, @Res() res: Response) {
    return this.forward(req, res, 'USER_SERVICE_URL', 'http://localhost:3000');
  }

  @All(['products', 'products/*path'])
  products(@Req() req: Request, @Res() res: Response) {
    return this.forward(
      req,
      res,
      'PRODUCT_SERVICE_URL',
      'http://localhost:3001',
    );
  }

  private async forward(
    req: Request,
    res: Response,
    envName: string,
    defaultUrl: string,
  ) {
    try {
      const chunks: Buffer[] = [];

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
        }
      }

      const headers = new Headers();

      for (const [key, value] of Object.entries(req.headers)) {
        if (
          value &&
          !['host', 'connection', 'content-length'].includes(key.toLowerCase())
        ) {
          headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        }
      }

      const upstream = process.env[envName] ?? defaultUrl;
      const path = req.originalUrl.replace(/^\/api(?=\/|\?|$)/, '');
      const response = await fetch(`${upstream}${path}`, {
        method: req.method,
        headers,
        redirect: 'manual',
        ...(req.method === 'GET' || req.method === 'HEAD'
          ? {}
          : { body: new Uint8Array(Buffer.concat(chunks)) }),
        signal: AbortSignal.timeout(15000),
      });

      res.status(response.status);

      response.headers.forEach((value, key) => {
        if (
          ![
            'connection',
            'content-length',
            'content-encoding',
            'transfer-encoding',
          ].includes(key.toLowerCase())
        ) {
          res.setHeader(key, value);
        }
      });

      res.send(Buffer.from(await response.arrayBuffer()));
    } catch {
      console.error('Gateway forwarding error:');
      if (!res.headersSent) {
        throw new HttpException(
          { message: 'Backend service unavailable' },
          HttpStatus.BAD_GATEWAY,
        );
      }
    }
  }
}
