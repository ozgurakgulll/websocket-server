import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallModule } from './call/call.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    CallModule,
    BullModule.forRoot({
      redis: "redis://default:uxNaCRyYJmdNhOhESticzEFSTwgbZEjv@autorack.proxy.rlwy.net:56790",
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
