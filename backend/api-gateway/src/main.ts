import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const app = await NestFactory.create(AppModule, {
  bodyParser: false,
});

app.enableShutdownHooks();

await app.listen(Number(process.env.PORT ?? 3003));
