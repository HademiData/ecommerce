import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express, type Request, type Response } from 'express';
import { AppModule } from './app.module.js';

let bootstrapPromise: Promise<Express> | undefined;

async function bootstrapServer(): Promise<Express> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const expressApp = express();

      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { bodyParser: false },
      );

      await app.init();
      return expressApp;
    })();
  }

  return bootstrapPromise;
}

export default async function handler(req: Request, res: Response) {
  const server = await bootstrapServer();
  return server(req, res);
}

if (process.env.NODE_ENV !== 'production') {
  async function bootstrapLocal() {
    const app = await NestFactory.create(AppModule, {
      bodyParser: false,
    });

    await app.listen(Number(process.env.PORT ?? 3003));
  }

  bootstrapLocal();
}
