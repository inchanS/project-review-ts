import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type estimationType = 'double Like' | 'like';

@Entity('estimation')
export class Estimation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ['double like', 'like'] })
  estimation: estimationType;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;
}
