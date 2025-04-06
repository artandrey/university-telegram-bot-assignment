import { toBuilderMethod } from 'class-constructor';

import { Entity, Nominal } from '~shared/domain/entities/entity';

import { Currency, CurrencyId } from './currency.entity';
import { Product, ProductId } from './product.entity';

export type PriceId = Nominal<string, 'PriceId'>;

// Using BigInt for amount as per Strapi schema
export interface IPriceOptionals {
  id: PriceId;
  amount: bigint;
  currency: Currency;
  product: Product;
}

export class Price extends Entity<PriceId> {
  private _amount: bigint;
  private _currency: Currency;
  private _product: Product; // Reference to the product this price belongs to

  get amount(): bigint {
    return this._amount;
  }

  get currency(): Currency {
    return this._currency;
  }

  get product(): Product {
    return this._product;
  }

  public static builder = toBuilderMethod(Price).withOptionals<IPriceOptionals>();
}
