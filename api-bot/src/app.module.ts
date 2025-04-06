import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { SessionsModule } from './modules/sessions/sessions.module';

@Module({
  imports: [CoreModule, SharedModule, SessionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
