# Repository Creation Guide

This guide details the steps required to create a new repository within the `api-bot` project, adhering to the established Clean Architecture and Domain-Driven Design (DDD) principles, utilizing Drizzle ORM for persistence.

**Goal:** Define data access logic for a specific domain aggregate root.

**Key Concepts:**

- **Domain Entity:** The core object representing the data within your business domain (`shared/domain/entities/entity.ts`).
- **Repository Interface:** Defines the contract for data access operations specific to the entity (`modules/<module_name>/domain/repositories/<entity_name>-repository.interface.ts`). It extends `IBaseRepository`.
- **Persistence Model:** The Drizzle schema definition representing the database table structure (`modules/<module_name>/infrastructure/persistence/drizzle/schema/<entity_name>.schema.ts`).
- **Data Access Mapper:** Translates between the Domain Entity and the Persistence Model (`modules/<module_name>/infrastructure/persistence/drizzle/mappers/<entity_name>.mapper.ts`). Implements `IDataAccessMapper`.
- **Repository Implementation:** Implements the Repository Interface using Drizzle ORM client provided via `IDbContext` (`modules/<module_name>/infrastructure/persistence/drizzle/repositories/<entity_name>.repository.ts`).
- **Database Context (`IDbContext`):** Provides access to all registered repository implementations (`shared/application/services/db-context.interface.ts`).

**Steps:**

1.  **Define Domain Entity:**

    - If not already present, create the domain entity extending `Entity<TId>` in `modules/<module_name>/domain/entities/<entity_name>.ts`.
    - Example: `SessionEntity extends Entity<string>`

2.  **Define Repository Interface:**

    - Create an interface in `modules/<module_name>/domain/repositories/<entity_name>-repository.interface.ts`.
    - Extend the generic `IBaseRepository<TEntity, TId>` from `shared/domain/repositories/base-repository.interface.ts`.
    - Add any entity-specific query methods needed beyond the base CRUD operations.
    - Example (`ISessionRepository`):

      ```typescript
      import { IBaseRepository } from '~shared/domain/repositories/base-repository.interface';

      import { SessionEntity } from '../entities/session.entity';

      export interface ISessionRepository extends IBaseRepository<SessionEntity, string> {
        // Add custom methods like findByUserId(userId: string): Promise<SessionEntity[]>;
      }
      ```

3.  **Define Drizzle Schema (Persistence Model):**

    - Create the Drizzle table schema in `modules/<module_name>/infrastructure/persistence/drizzle/schema/<entity_name>.schema.ts`.
    - Use `pgTable` (or the appropriate function for your DB driver) to define columns matching the entity's properties.
    - Export the schema object and the inferred `Select` and `Insert` types.
    - Example (`sessionsSchema`):

      ```typescript
      import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
      import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
      import { z } from 'zod';

      export const sessionsSchema = pgTable('sessions', {
        id: text('id').primaryKey(),
        userId: text('user_id').notNull(),
        // ... other columns
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
      });

      export const SelectSessionSchema = createSelectSchema(sessionsSchema);
      export const InsertSessionSchema = createInsertSchema(sessionsSchema);

      export type SessionPersistence = z.infer<typeof SelectSessionSchema>;
      ```

    - **Important:** Add your new schema to the `mergedSchema` in `shared/infrastructure/persistence/drizzle/schema/merged-schema.ts`.

4.  **Implement Data Access Mapper:**

    - Create a class in `modules/<module_name>/infrastructure/persistence/drizzle/mappers/<entity_name>.mapper.ts`.
    - Implement the `IDataAccessMapper<TEntity, TPersistence>` interface (you might need to create this generic interface if it doesn't exist in `shared/domain/mappers/`).
    - Implement `toDomain(persistence: TPersistence): TEntity` and `toPersistence(entity: TEntity): TPersistence` methods.
    - Use a library like `class-constructor` or manual mapping.
    - Example (`SessionMapper`):

      ```typescript
      // Assuming this exists
      import { Injectable } from '@nestjs/common';
      import { plainToInstance } from 'class-transformer';

      import { SessionEntity } from '~modules/sessions/domain/entities/session.entity';
      import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';

      import { SessionPersistence } from '../schema/sessions.schema';

      // Or use class-constructor

      @Injectable() // Make it injectable if needed elsewhere or by the repository
      export class SessionMapper implements IDataAccessMapper<SessionEntity, SessionPersistence> {
        toDomain(persistence: SessionPersistence): SessionEntity {
          // Map persistence fields to entity fields
          return plainToInstance(SessionEntity, persistence); // Example using class-transformer
        }

        toPersistence(entity: SessionEntity): SessionPersistence {
          // Map entity fields to persistence fields
          // Be careful with readonly fields like id if not generated by DB
          return {
            id: entity.id,
            userId: entity.userId,
            // ... other fields
            createdAt: entity.createdAt, // Ensure types match
            updatedAt: entity.updatedAt,
          };
        }
      }
      ```

5.  **Implement Repository:**

    - Create a class in `modules/<module_name>/infrastructure/persistence/drizzle/repositories/<entity_name>.repository.ts`.
    - Implement the `I<EntityName>Repository` interface created in step 2.
    - Inject the Drizzle database instance (`BetterSQLite3Database<MergedSchema>` or similar) typically via a token like `SQLITE_DB` or `DB_PROVIDER_TOKEN`.
    - Inject the `Mapper` created in step 4.
    - Use the injected DB instance and schema definition to implement the repository methods (findById, save, delete, custom methods).
    - Use the mapper to convert between domain and persistence objects.
    - Example (`DrizzleSessionRepository`):

      ```typescript
      import { Inject, Injectable } from '@nestjs/common';
      import { eq } from 'drizzle-orm';
      import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

      import { SessionEntity } from '~modules/sessions/domain/entities/session.entity';
      import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';
      import { MergedSchema } from '~shared/infrastructure/persistence/drizzle/schema';

      // Use the merged schema type
      import { SQLITE_DB } from 'src/lib/drizzle-sqlite';

      import { SessionMapper } from '../mappers/session.mapper';
      // Or your DB injection token
      import { SessionPersistence, sessionsSchema } from '../schema/sessions.schema';

      @Injectable()
      export class DrizzleSessionRepository implements ISessionRepository {
        constructor(
          @Inject(SQLITE_DB) private readonly db: BetterSQLite3Database<MergedSchema>,
          private readonly mapper: SessionMapper,
        ) {}

        async findById(id: string): Promise<SessionEntity | null> {
          const [result] = await this.db.select().from(sessionsSchema).where(eq(sessionsSchema.id, id)).limit(1);
          return result ? this.mapper.toDomain(result) : null;
        }

        async save(entity: SessionEntity): Promise<string> {
          const persistenceData = this.mapper.toPersistence(entity);
          const [result] = await this.db
            .insert(sessionsSchema)
            .values(persistenceData)
            .onConflictDoUpdate({ target: sessionsSchema.id, set: persistenceData }) // Assuming upsert logic
            .returning({ id: sessionsSchema.id });
          return result.id;
        }

        async delete(id: string): Promise<void> {
          await this.db.delete(sessionsSchema).where(eq(sessionsSchema.id, id));
        }

        // Implement custom methods using this.db and this.mapper
      }
      ```

6.  **Register Repository in `IDbContext`:**

    - Add a readonly property for the new repository interface in `shared/application/services/db-context.interface.ts`.

      ```typescript
      import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';

      export interface IDbContext extends IDbRepositories {
        // ... other repositories
        readonly sessionRepository: ISessionRepository;
      }
      ```

    - In the `DrizzleDbContext` implementation (`shared/infrastructure/persistence/drizzle/db-context/drizzle-db-context.ts`):

      - Inject the new repository implementation (`DrizzleSessionRepository`).
      - Assign the injected instance to the corresponding property.

      ```typescript
      import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface';
      import { DrizzleSessionRepository } from '~modules/sessions/infrastructure/persistence/drizzle/repositories/session.repository';

      @Injectable({ scope: Scope.REQUEST }) // Or appropriate scope
      export class DrizzleDbContext<TSchema extends Record<string, unknown> = MergedSchema> implements IDbContext {
        // ... existing constructor and properties

        public readonly sessionRepository: ISessionRepository;

        constructor(
          @Inject(SQLITE_DB) protected readonly db: BetterSQLite3Database<TSchema>,
          @Inject(CoreToken.APP_LOGGER) private readonly logger: Logger,
          // Inject new repository implementation
          _sessionRepository: DrizzleSessionRepository,
        ) {
          // ... existing assignments
          this.sessionRepository = _sessionRepository;
        }

        // ... other methods
      }
      ```

7.  **Provide Repository Implementation in Module:**

    - Ensure the repository implementation (`DrizzleSessionRepository`), its mapper (`SessionMapper`), and the repository interface (`ISessionRepository`) are provided and exported within the relevant module (`modules/<module_name>/infrastructure/nest/<module_name>.module.ts` or a dedicated persistence module).
    - This usually involves adding the implementation class to the `providers` array and the interface token mapped to the class. If the `DrizzleDbContext` is correctly set up and the repository is injected there, you might only need to provide the implementation class itself. Check the `DatabaseModule` (`shared/infrastructure/persistence/database.module.ts`) and module structure for the exact pattern. It's common to provide the implementation and map the interface token to it.
    - Example within a hypothetical `SessionsPersistenceModule`:

      ```typescript
      import { Module } from '@nestjs/common';

      import { BaseToken } from '~shared/constants';

      import { SessionMapper } from './drizzle/mappers/session.mapper';
      import { DrizzleSessionRepository } from './drizzle/repositories/session.repository';

      // Assuming a token exists for ISessionRepository

      // Define a token if not using BaseToken
      export const SESSION_REPOSITORY_TOKEN = Symbol('ISessionRepository');

      @Module({
        providers: [
          SessionMapper,
          DrizzleSessionRepository,
          // Map the interface token to the implementation class
          {
            provide: SESSION_REPOSITORY_TOKEN /* or BaseToken.SESSION_REPOSITORY */,
            useClass: DrizzleSessionRepository,
          },
        ],
        exports: [
          SESSION_REPOSITORY_TOKEN, // Export the token
        ],
      })
      export class SessionsPersistenceModule {}
      ```

    - Ensure this persistence module is imported into the main module for the feature (e.g., `SessionsModule`).

**Summary:**

By following these steps, you create a well-structured repository that encapsulates data access logic, integrates with the Drizzle ORM setup, and adheres to the project's architectural patterns. Remember to adapt file paths and specific names (`<module_name>`, `<entity_name>`) according to your feature.
