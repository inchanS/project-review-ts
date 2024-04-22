import {
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import { DateUtils } from '../utils/dateUtils';

export const dateTransformer: ValueTransformer = {
  from: (value: Date) =>
    value instanceof Date ? DateUtils.formatDate(value) : value,
  to: (value: Date) => value,
};

export abstract class Base extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: 'timestamp', transformer: dateTransformer })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', transformer: dateTransformer })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', transformer: dateTransformer })
  deleted_at: Date | null;

  constructor() {
    super();
    this.created_at = new Date();
    this.updated_at = new Date();
    this.deleted_at = null;
  }
}
