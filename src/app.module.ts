import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './core/database/index.js';
import { ApiKeysModule } from './modules/api-keys/api-keys.module.js';
import { CctvModule } from './modules/cctv/cctv.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HttpExceptionFilter } from './core/common/filters/http-exception.filter.js';
import { ResponseInterceptor } from './core/common/interceptors/response.interceptor.js';

@Module({
  imports: [DatabaseModule, ApiKeysModule, CctvModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
