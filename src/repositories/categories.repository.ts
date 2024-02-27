import { Repository } from 'typeorm';
import dataSource from './data-source';
import { Category } from '../entities/category.entity';

export class CategoriesRepository extends Repository<Category> {
  private static instance: CategoriesRepository;

  private constructor() {
    super(Category, dataSource.createEntityManager());
  }

  public static getInstance(): CategoriesRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }
}
