import { toBuilderMethod } from 'class-constructor';

import { Entity, Nominal } from '~shared/domain/entities/entity';

export type CategoryId = Nominal<string, 'CategoryId'>;

export interface ICategoryOptionals {
  id: CategoryId;
  title: string;
  thumbnail?: string;
}

export class Category extends Entity<CategoryId> {
  private _title: string;
  private _thumbnail?: string;

  get title(): string {
    return this._title;
  }

  get thumbnail(): string | undefined {
    return this._thumbnail;
  }

  public static builder = toBuilderMethod(Category).withOptionals<ICategoryOptionals>();
}
