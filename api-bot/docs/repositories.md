# Repository Creation Guide

This guide explains how to create data repositories following the established pattern in this project. The primary focus is on using Drizzle ORM, but the principles apply broadly.

## Core Concepts

Repositories abstract data persistence logic, providing a clean interface for use cases to interact with data sources without knowing the underlying implementation details (e.g., specific database or ORM).

Key components involved:

1.  **Domain Entity:** The core business object (e.g., `Session`). Located in `src/modules/<module>/domain/entities/`.
2.  **Repository Interface:** Defines the contract for the repository. Located in `src/modules/<module>/domain/repositories/`. Extends `IBaseRepository`.
3.  **Persistence Implementation:** The concrete implementation of the repository interface using a specific ORM/database. Located in `src/modules/<module>/infrastructure/persistence/<orm>/repositories/`. Extends a generic ORM-specific base repository (e.g., `DrizzleRepository`).
4.  **Data Mapper:** Translates between the domain entity and the persistence model. Located in `src/modules/<module>/infrastructure/persistence/<orm>/mappers/`. Implements `IDataAccessMapper`.
5.  **Database Schema:** Defines the database table structure. Located in `src/shared/infrastructure/persistence/schema/`.
6.  **Dependency Injection:** Wiring everything together using NestJS modules.

## Step-by-Step Guide

Follow these steps to create a new repository, using the `Session` entity as an example.

**1. Define the Domain Entity:**

Ensure your domain entity exists (e.g., `Session` in `api-bot/src/modules/sessions/domain/entities/session.entity.ts`). It should extend the base `Entity` class and define its properties and potentially custom ID types.

Domain entities in this project utilize the Builder Pattern for construction, facilitated by the `class-constructor` library. This pattern simplifies object creation, especially when dealing with numerous optional properties.

**Key points for Entity creation:**

- **Base Class:** Entities typically extend `Entity<IdType>` from `~shared/domain/entities/entity.ts`.
- **Properties:** Define public properties. Optional properties can have default values.
- **`tsconfig.json`:** Ensure `"useDefineForClassFields": true` or `"target": "ES2022"` (or higher) is set in your `tsconfig.json`. This is crucial for the `class-constructor` library to correctly identify class fields.
- **Builder Method:** Implement a static `builder` method using `toBuilderMethod` from `class-constructor`.
  - Use `.classAsOptionals()` if all optional properties are public members of the class.
  - Use `.withOptionals<InterfaceName>()` if you need to set private properties (define an interface listing the optional properties without the private prefix, e.g., `_`).

```typescript
// Example: api-bot/src/modules/sessions/domain/entities/session.entity.ts
import { toBuilderMethod } from 'class-constructor';

import { Entity } from '~shared/domain/entities/entity';
import { Nominal } from '~shared/domain/types';

// Import the helper

export type SessionId = Nominal<string, 'SessionId'>;

// Optional: Interface for private properties if needed for builder
// interface SessionOptionals {
//   preferredLanguage?: string;
//   preferredCurrency?: string;
// }

export class Session extends Entity<SessionId> {
  // Properties (required ones might be set in constructor or via builder)
  public readonly preferredLanguage: string;
  public readonly preferredCurrency: string;

  // Constructor (can be simple or handle required fields)
  // The builder often bypasses the constructor for setting properties,
  // but it might be needed for logic or required field enforcement without builder.
  // Ensure properties are declared if not assigned in constructor when useDefineForClassFields is true.

  // --- Builder Implementation ---
  // Use .classAsOptionals() if preferredLanguage/preferredCurrency were public optional fields
  // public static builder = toBuilderMethod(Session).classAsOptionals();

  // Or, define an interface for optional properties if needed (e.g., for private fields)
  // Ensure the interface properties match the intended builder methods
  // public static builder = toBuilderMethod(Session).withOptionals<SessionOptionals>();

  // --- Example Builder Definition (assuming properties are set via builder) ---
  // This assumes the builder sets all required properties defined in the interface.
  public static builder = toBuilderMethod(Session, (builder) => ({
    // Define required fields for the initial builder call if any
    // e.g., id: builder.id,
  })).withOptionals<{
    // List properties settable via builder methods
    id: SessionId;
    preferredLanguage: string;
    preferredCurrency: string;
  }>();

  // --- Using the Builder ---
  // const session = Session.builder() // Call static builder()
  //   .id(generateSessionId())      // Set properties using builder methods
  //   .preferredLanguage('en')
  //   .preferredCurrency('USD')
  //   .build();                     // Finalize object construction

  // ... other domain logic ...
}
```

**2. Define the Repository Interface:**

Create an interface for your repository in `src/modules/<module>/domain/repositories/`. It should extend the generic `IBaseRepository`.

- File Path: `api-bot/src/modules/sessions/domain/repositories/session-repository.interface.ts`
- Content:

```typescript
import { IBaseRepository } from '~shared/domain/repositories/base-repository.interface';

import { Session, SessionId } from '../entities/session.entity';

export interface ISessionRepository extends IBaseRepository<Session, SessionId> {}
```

- **`IBaseRepository`**: Located in `api-bot/src/shared/domain/repositories/base-repository.interface.ts`, it provides standard methods:
  - `findById(id: Id): Promise<E>`
  - `save(entity: E): Promise<Id>`
  - `delete(id: Id): Promise<void>`

**3. Define the Database Schema:**

Define the corresponding database table schema in `src/shared/infrastructure/persistence/schema/`. Use the appropriate ORM functions (e.g., `pgTable` for Drizzle with PostgreSQL). Ensure types match the domain entity, potentially using `$type` for custom nominal types.

- File Path: `api-bot/src/shared/infrastructure/persistence/schema/public-database-schema.ts` (or potentially another schema file depending on context)
- Content:

```typescript
import { pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { SessionId } from '~modules/sessions/domain/entities/session.entity';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().$type<SessionId>(), // Match SessionId type
  preferredLanguage: text('preferred_language').notNull(),
  preferredCurrency: text('preferred_currency').notNull(),
});
```

**4. Implement the Data Mapper:**

Create a mapper class in `src/modules/<module>/infrastructure/persistence/<orm>/mappers/`. It implements the `IDataAccessMapper` interface.

- **`IDataAccessMapper`**: Located in `api-bot/src/shared/domain/mappers/data-access-mapper.interface.ts`. Requires methods:
  - `toPersistence(entity: TEntity): TPersistence`
  - `toDomain(persistence: TPersistence): TEntity`
- File Path: `api-bot/src/modules/sessions/infrastructure/persistence/drizzle/mappers/drizzle-session.mapper.ts`
- Content:

```typescript
import { Injectable } from '@nestjs/common';

import { Session } from '~modules/sessions/domain/entities/session.entity';
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';
import { sessions } from '~shared/infrastructure/persistence/schema/public-database-schema';

// Derive the persistence type from the schema
export type DrizzleSessionPersistence = typeof sessions.$inferSelect;

@Injectable()
export class DrizzleSessionMapper implements IDataAccessMapper<Session, DrizzleSessionPersistence> {
  toDomain(persistence: DrizzleSessionPersistence): Session {
    // Map raw persistence data to the domain entity instance
    return Session.builder()
      .id(persistence.id)
      .preferredLanguage(persistence.preferredLanguage)
      .preferredCurrency(persistence.preferredCurrency)
      .build();
  }

  toPersistence(domain: Session): DrizzleSessionPersistence {
    // Map domain entity instance to raw persistence data
    return {
      id: domain.id,
      preferredLanguage: domain.preferredLanguage,
      preferredCurrency: domain.preferredCurrency,
    };
  }
}
```

**5. Implement the Repository:**

Create the repository implementation in `src/modules/<module>/infrastructure/persistence/<orm>/repositories/`.

- It should be `@Injectable()` (often with `Scope.REQUEST`).
- It extends the generic ORM repository base class (e.g., `DrizzleRepository`).
- It implements the specific repository interface created in Step 2.
- Inject the corresponding mapper from Step 4.
- Define `tableDefinition` using `TableDefinition.create(schema, idKey)`.

- File Path: `api-bot/src/modules/sessions/infrastructure/persistence/drizzle/repositories/drizzle-session.repoisotyr.ts` (Note the typo in the original filename)
- Content:

```typescript
import { Inject, Injectable, Scope } from '@nestjs/common';

import { Session } from '~modules/sessions/domain/entities/session.entity';
import { ISessionRepository } from '~modules/sessions/domain/repositories/session-repository.interface.ts';
// Corrected path
import { IDataAccessMapper } from '~shared/domain/mappers/data-access-mapper.interface';
import {
  DrizzleRepository,
  TableDefinition,
} from '~shared/infrastructure/persistence/drizzle/repository/drizzle.repository';
import { sessions } from '~shared/infrastructure/persistence/schema/public-database-schema';

import { DrizzleSessionMapper, DrizzleSessionPersistence } from '../mappers/drizzle-session.mapper';

// Define table and primary key
const tableDefinition = TableDefinition.create(sessions, 'id');

@Injectable({ scope: Scope.REQUEST }) // Request scope is common if DbContext is request-scoped // Specify Entity and TableDefinition types // Implement the specific interface
export class DrizzleSessionRepository
  extends DrizzleRepository<Session, typeof tableDefinition>
  implements ISessionRepository
{
  protected readonly tableDefinition = tableDefinition; // Assign the definition

  constructor(
    @Inject(DrizzleSessionMapper) // Inject the specific mapper
    mapper: IDataAccessMapper<Session, DrizzleSessionPersistence>,
  ) {
    super(mapper); // Pass mapper to the base DrizzleRepository
  }
}
```

- **`DrizzleRepository`**: Located in `api-bot/src/shared/infrastructure/persistence/drizzle/repository/drizzle.repository.ts`. Provides the base `findById`, `save`, and `delete` implementations using Drizzle, the `tableDefinition`, and the injected `mapper`. It expects the `db` instance to be set via the `_setDatasource` method (handled by `DrizzleDbContext`).

**6. Configure Dependency Injection:**

Ensure the new Mapper and Repository implementation are provided to the NestJS application, usually globally.

- Add the Mapper and Repository classes to the `persistence` array.
- File Path: `api-bot/src/shared/infrastructure/persistence/providers.ts`
- Content:

```typescript
import { DrizzleSessionMapper } from '~modules/sessions/infrastructure/persistence/drizzle/mappers/drizzle-session.mapper';
import { DrizzleSessionRepository } from '~modules/sessions/infrastructure/persistence/drizzle/repositories/drizzle-session.repoisotyr.ts';

// Corrected path
// Add other Mappers and Repositories here
// import { DrizzleOtherEntityMapper } from '...';
// import { DrizzleOtherEntityRepository } from '...';

export const persistence = [
  DrizzleSessionRepository,
  DrizzleSessionMapper,
  // DrizzleOtherEntityRepository,
  // DrizzleOtherEntityMapper,
];
```

- Ensure the `persistence` array is spread into the `providers` of the `DatabaseModule`.
- File Path: `api-bot/src/shared/infrastructure/persistence/database.module.ts`

```typescript
// ... imports ...
import { persistence } from './providers';

// Import the providers array
// ... other imports ...

@Global()
@Module({
  imports: [
    // ... DrizzleSqliteModule or other DB driver module registration ...
  ],
  providers: [
    { provide: BaseToken.DB_CONTEXT, useClass: DrizzleDbContext },
    ...persistence, // Spread the persistence providers here
  ],
  exports: [BaseToken.DB_CONTEXT],
})
export class DatabaseModule {}
```

- The specific feature module (e.g., `SessionsModule`) generally does _not_ need to provide the Repository or Mapper again if they are globally provided by `DatabaseModule`. It will provide Use Cases which _inject_ the Repository interface.

## Summary

To create a new repository:

1.  Define **Entity** (`domain/entities/`).
2.  Define **Interface** (`domain/repositories/`) extending `IBaseRepository`.
3.  Define **Schema** (`shared/infrastructure/persistence/schema/`).
4.  Implement **Mapper** (`infrastructure/persistence/<orm>/mappers/`) implementing `IDataAccessMapper`.
5.  Implement **Repository** (`infrastructure/persistence/<orm>/repositories/`) extending `DrizzleRepository` (or similar) and implementing the interface.
6.  Add **Mapper & Repository** to `shared/infrastructure/persistence/providers.ts`.
    Ensure the `persistence` array is included in `DatabaseModule` providers.
