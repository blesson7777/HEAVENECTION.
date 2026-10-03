import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { databaseUrl, sessionTtl } from './config';

async function bootstrap() {
  databaseUrl();
  sessionTtl();
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableShutdownHooks();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, process.env.HOST ?? '127.0.0.1');
  Logger.log(`API listening on port ${port}`, 'Bootstrap');
}
bootstrap().catch(() => {
  Logger.error('API startup failed. Verify configuration, database availability, and migrations.', 'Bootstrap');
  process.exitCode = 1;
});
