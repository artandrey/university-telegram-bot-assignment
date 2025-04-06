import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

import { IDbContext } from '~shared/application/services/db-context.interface';

import { CoreToken } from 'src/core/constants';
import { SQLITE_DB } from 'src/lib/drizzle-sqlite';

@Injectable({ scope: Scope.REQUEST })
export class DrizzleDbContext<TSchema extends Record<string, unknown> = Record<string, never>> implements IDbContext {
  protected _db: BetterSQLite3Database<TSchema>;

  constructor(
    @Inject(SQLITE_DB) db: BetterSQLite3Database<TSchema>,
    @Inject(CoreToken.APP_LOGGER) private readonly logger: Logger,
  ) {
    this._db = db;
    this.initRepositories();
  }

  public async commitTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not committed: current db context implementation does not provide transaction functionality yet',
    );
  }
  public async rollbackTransaction(): Promise<void> {
    this.logger.warn(
      'Not transaction to rollback: current db context implementation does not provide transaction functionality yet',
    );
  }
  public async startTransaction(): Promise<void> {
    this.logger.warn(
      'Transaction was not started: current db context implementation does not provide transaction functionality yet',
    );
  }

  private initRepositories() {}
}
