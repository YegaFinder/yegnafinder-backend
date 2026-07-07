import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Build allowed origins: always include the production Vercel frontend,
  // plus any extra origins supplied via FRONTEND_ORIGIN env var.
  const defaultOrigins = [
    'https://yega-finder-frontend.vercel.app',
    'http://localhost:3000',
  ];
  const extraOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [];
  const allowedOrigins = [...new Set([...defaultOrigins, ...extraOrigins])];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('YegnaFinder V2 API')
    .setDescription('The backend API for YegnaFinder PWA')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(configService.get<string>('PORT') || 8000);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}/api/v1`);
  console.log(`Swagger docs available at: http://0.0.0.0:${port}/api/docs`);
}
bootstrap();
