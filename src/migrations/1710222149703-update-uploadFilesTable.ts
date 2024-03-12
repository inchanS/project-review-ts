import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export class UpdateUploadFilesTable1710222149703 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'upload_files',
      new TableColumn({
        name: 'userId',
        type: 'int',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'upload_files',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );

    await queryRunner.query(`
        UPDATE upload_files
        SET userId = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(file_link, '/', 4), '/', -1) AS UNSIGNED)
    `);

    await queryRunner.changeColumn(
      'upload_files',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'int',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'upload_files',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'int',
        isNullable: true,
      })
    );

    await queryRunner.dropForeignKey('upload_files', 'fk_upload_files_userId');

    await queryRunner.dropColumn('upload_files', 'userId');
  }
}
