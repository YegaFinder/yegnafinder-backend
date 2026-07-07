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

  app.enableCors({
    // Allow the Next.js dev server and any configured production PWA origin.
    // NEXT_PUBLIC_API_URL in the frontend points to localhost:8000, and the
    // frontend itself runs on localhost:3000 by default.
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',')
      : ['http://localhost:3000'],
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
