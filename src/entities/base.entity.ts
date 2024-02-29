import {
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';
import { DateUtils } from '../utils/dateUtils';

export const transformer: ValueTransformer = {
  from: (value: Date) =>
    value instanceof Date ? DateUtils.formatDate(value) : value,
  to: (value: Date) => value,
};

export abstract class Base extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: 'timestamp', transformer: transformer })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp', transformer: transformer })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', transformer: transformer })
  deleted_at?: Date | null;
}
