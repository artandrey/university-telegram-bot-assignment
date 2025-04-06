import { Injectable } from '@nestjs/common';

import { Session } from '~modules/sessions/domain/entities/session.entity';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';
import { sessions } from '~shared/infrastructure/persistence/schema/public-database-schema';

export type DrizzleSessionPersistence = typeof sessions.$inferSelect;

@Injectable()
export class DrizzleSessionMapper implements IDataAccessMapper<Session, DrizzleSessionPersistence> {
  toDomain(persistence: DrizzleSessionPersistence): Session {
    return Session.builder()
      .id(persistence.id)
      .preferredLanguage(persistence.preferredLanguage)
      .preferredCurrency(persistence.preferredCurrency)
      .build();
  }

  toPersistence(domain: Session): DrizzleSessionPersistence {
    return {
      id: domain.id,
      preferredLanguage: domain.preferredLanguage,
      preferredCurrency: domain.preferredCurrency,
    };
  }
}
