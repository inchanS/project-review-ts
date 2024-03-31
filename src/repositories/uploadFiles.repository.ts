import { Repository } from 'typeorm';
import dataSource from './data-source';
import { UploadFiles } from '../entities/uploadFiles.entity';

export class UploadFilesRepository extends Repository<UploadFiles> {
  private static instance: UploadFilesRepository;

  private constructor() {
    super(UploadFiles, dataSource.createEntityManager());
  }

  public static getInstance(): UploadFilesRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }
}
