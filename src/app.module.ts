import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CallModule } from './call/call.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    CallModule,
    BullModule.forRoot({
      redis: {
        host: 'redis.railway.internal',
        port: 6379,
        password: 'uxNaCRyYJmdNhOhESticzEFSTwgbZEjv',
        username:'default'
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
