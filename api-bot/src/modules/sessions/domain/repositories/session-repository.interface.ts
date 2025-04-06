import { IBaseRepository } from '~shared/domain/repositories/base-repository.interface';

import { Session, SessionId } from '../entities/session.entity';

export interface ISessionRepository extends IBaseRepository<Session, SessionId> {}
