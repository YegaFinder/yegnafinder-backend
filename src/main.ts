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

  // Allow all yega-finder-frontend Vercel deployments (production + previews)
  // plus any extra origins from FRONTEND_ORIGIN env var.
  const extraOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, Swagger UI)
      if (!origin) return callback(null, true);
      // Allow localhost dev
      if (origin.startsWith('http://localhost')) return callback(null, true);
      // Allow all yega-finder-frontend Vercel deployments
      if (
        /^https:\/\/yega-finder-frontend(-[a-z0-9]+)?\.vercel\.app$/.test(
          origin,
        )
      ) {
        return callback(null, true);
      }
      // Allow any extra origins configured via env var
      if (extraOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
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
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
