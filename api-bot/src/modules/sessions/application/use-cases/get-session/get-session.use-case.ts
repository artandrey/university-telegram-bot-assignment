import { SessionId } from '~modules/sessions/domain/entities/session.entity';
import { Query } from '~shared/application/CQS/query.abstract';
import { IUseCase } from '~shared/application/use-cases/use-case.interface';

import { SessionDto } from '../../dto/session';

export interface IGetSessionPayload {
  id: string;
}

export interface IGetSessionUseCase extends IUseCase<IGetSessionPayload, SessionDto> {}

export class GetSessionQuery extends Query<IGetSessionPayload, SessionDto> {
  protected async implementation(): Promise<SessionDto> {
    const { id } = this._input;

    const session = await this._dbContext.sessionRepository.findById(id as SessionId);

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      preferredLanguage: session.preferredLanguage,
      preferredCurrency: session.preferredCurrency,
    };
  }
}
