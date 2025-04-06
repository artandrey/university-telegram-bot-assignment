import { Session } from '~modules/sessions/domain/entities/session.entity';
import { Command } from '~shared/application/CQS/command.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { CreateSessionDto, CreateSessionResultDto } from '../../dto/session';

export interface ICreateSessionPayload {
  options: CreateSessionDto;
}

export interface ICreateSessionUseCase extends IUseCase<ICreateSessionPayload, CreateSessionResultDto> {}

export class CreateSessionUseCase extends Command<ICreateSessionPayload, CreateSessionResultDto> {
  protected async implementation(): Promise<CreateSessionResultDto> {
    const { options } = this._input;

    const session = Session.builder()
      .preferredLanguage(options.preferredLanguage)
      .preferredCurrency(options.preferredCurrency)
      .build();

    await this._dbContext.sessionRepository.save(session);

    return {
      id: session.id,
    };
  }
}
