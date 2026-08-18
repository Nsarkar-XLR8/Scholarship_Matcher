import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for zero-auth public frontend
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Setup OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Global Masters Scholarship Matcher API')
    .setDescription('High-performance, zero-auth backend API for university eligibility matching, multi-scoped scholarship rules, and crowdsourced outcome distributions.')
    .setVersion('1.0.0')
    .addTag('Taxonomy & Geography')
    .addTag('Universities & Programs')
    .addTag('Eligibility & Matching Engine')
    .addTag('Faceted Search Engine')
    .addTag('Crowdsourced Outcome Reports')
    .addTag('Country Comparison & FX Normalization')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Global Masters Scholarship Matcher Backend running on http://localhost:${port}`);
  logger.log(`📚 Swagger API Documentation available on http://localhost:${port}/api/docs`);
}

bootstrap();
