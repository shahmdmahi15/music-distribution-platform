import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  app.use(
    json({
      limit: '100mb',
      verify: (req: any, res, buf) => {
        req.rawBody = buf.toString('utf-8');
      },
    }),
  );
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableShutdownHooks();

  const port = configService.get<number>('PORT')!;
  await app.listen(port);
}

void bootstrap();
