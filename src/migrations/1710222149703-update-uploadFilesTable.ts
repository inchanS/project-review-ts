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
        name: 'fk_upload_files_userId',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );

    await queryRunner.query(`
        UPDATE upload_files
        SET userId = CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(file_link, '/', 4), '/', -1) AS UNSIGNED)
    `);

    await queryRunner.dropForeignKey('upload_files', 'fk_upload_files_userId');

    await queryRunner.changeColumn(
      'upload_files',
      'userId',
      new TableColumn({
        name: 'userId',
        type: 'int',
        isNullable: false,
      })
    );

    await queryRunner.createForeignKey(
      'upload_files',
      new TableForeignKey({
        name: 'fk_upload_files_userId',
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('upload_files', 'fk_upload_files_userId');

    await queryRunner.dropColumn('upload_files', 'userId');
  }
}
