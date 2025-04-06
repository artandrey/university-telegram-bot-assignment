import { toBuilderMethod } from 'class-constructor';

import { Entity, Nominal } from '~shared/domain/entities/entity';

import { Category } from './category.entity';
import { Price, PriceId } from './price.entity';

export type ProductId = Nominal<string, 'ProductId'>;

export interface IProductOptionals {
  id: ProductId;
  title: string;
  description?: string;
  price: Price;
  category: Category;
}

export class Product extends Entity<ProductId> {
  private _title: string;
  private _description?: string;
  private _price: Price;
  private _category: Category;

  get title(): string {
    return this._title;
  }

  get description(): string | undefined {
    return this._description;
  }

  get price(): Price {
    return this._price;
  }

  get category(): Category {
    return this._category;
  }

  public static builder = toBuilderMethod(Product).withOptionals<IProductOptionals>();
}
