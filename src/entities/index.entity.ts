import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class Base {
  @PrimaryGeneratedColumn()
  id?: number;

  @CreateDateColumn({
    type: 'datetime',
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
  })
  public updated_at?: Date;
}
