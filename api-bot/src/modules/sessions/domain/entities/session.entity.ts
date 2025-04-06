import { toBuilderMethod } from 'class-constructor';

import { Entity } from '~shared/domain/entities/entity';

export type SessionId = string & { readonly __brand: unique symbol };

export interface ISessionOptionals {
  id: SessionId;
  preferredLanguage: string;
  preferredCurrency: string;
}

export class Session extends Entity<SessionId> {
  private _preferredLanguage: string = 'en';
  private _preferredCurrency: string = 'usd';

  get preferredLanguage(): string {
    return this._preferredLanguage;
  }

  get preferredCurrency(): string {
    return this._preferredCurrency;
  }

  set preferredLanguage(language: string) {
    this._preferredLanguage = language;
  }

  set preferredCurrency(currency: string) {
    this._preferredCurrency = currency;
  }

  public static builder = toBuilderMethod(Session).withOptionals<ISessionOptionals>();
}
