import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { SessionId } from '~modules/sessions/domain/entities/session.entity';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().$type<SessionId>(),
  preferredLanguage: text('preferred_language').notNull(),
  preferredCurrency: text('preferred_currency').notNull(),
});
