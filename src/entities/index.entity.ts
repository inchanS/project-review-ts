import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class Base {
  @PrimaryGeneratedColumn()
  id?: number;

  @CreateDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  public created_at?: Date;

  @UpdateDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  public updated_at?: Date;

  @DeleteDateColumn({
    type: 'datetime',
    transformer: {
      from: (value: Date) =>
        value
          ? `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
              value.getDate()
            )} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(
              value.getSeconds()
            )}`
          : '',
      to: (value: string) => new Date(value),
    },
  })
  deleted_at?: Date | null;
}

function pad(num: number): string {
  return num.toString().padStart(2, '0');
}
