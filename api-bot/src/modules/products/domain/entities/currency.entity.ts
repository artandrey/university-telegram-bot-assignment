import { toBuilderMethod } from 'class-constructor';

import { Entity, Nominal } from '~shared/domain/entities/entity';

export type CurrencyId = Nominal<string, 'CurrencyId'>;

export interface ICurrencyOptionals {
  id: CurrencyId;
  title: string;
  code: string;
  decimalPlaces: number;
}

export class Currency extends Entity<CurrencyId> {
  private _title: string;
  private _code: string;
  private _decimalPlaces: number;

  get title(): string {
    return this._title;
  }

  get code(): string {
    return this._code;
  }

  get decimalPlaces(): number {
    return this._decimalPlaces;
  }

  public static builder = toBuilderMethod(Currency).withOptionals<ICurrencyOptionals>();
}
