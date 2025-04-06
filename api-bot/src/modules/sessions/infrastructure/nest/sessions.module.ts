import { Module } from '@nestjs/common';

import { CreateSessionUseCase } from '../../application/use-cases/create-session/create-session.use-case';
import { SessionDiToken } from '../../constants';

@Module({
  providers: [{ provide: SessionDiToken.CREATE_SESSION_USE_CASE, useClass: CreateSessionUseCase }],
})
export class SessionsModule {}
