import { Inject, Injectable, Scope } from '@nestjs/common';

import { Session } from '~modules/sessions/domain/entities/session.entity';
import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';
import {
  DrizzleRepository,
  TableDefinition,
} from '~shared/infrastructure/persistence/drizzle/repository/drizzle.repository';
import { sessions } from '~shared/infrastructure/persistence/schema/public-database-schema';

import { DrizzleSessionMapper, DrizzleSessionPersistence } from '../mappers/drizzle-session.mapper';

const tableDefinition = TableDefinition.create(sessions, 'id');

@Injectable({ scope: Scope.REQUEST })
export class DrizzleSessionRepository
  extends DrizzleRepository<Session, typeof tableDefinition>
  implements ISessionRepository
{
  protected readonly tableDefinition = tableDefinition;

  constructor(
    @Inject(DrizzleSessionMapper)
    mapper: IDataAccessMapper<Session, DrizzleSessionPersistence>,
  ) {
    super(mapper);
  }
}
