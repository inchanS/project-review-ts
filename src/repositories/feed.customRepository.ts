import { Feed } from '../entities/feed.entity';
import {
  DataSource,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

export class FeedCustomRepository {
  private feedRepository: Repository<Feed>;

  constructor(private dataSource: DataSource) {
    this.feedRepository = this.dataSource.getRepository(Feed);
  }

  async createFeed(feedInfo: Feed, queryRunner: QueryRunner): Promise<Feed> {
    // typeORM의 save, update 등의 메소드는 호출할때마다 새로운 트랜잭션을 자체적으로 시작한다.
    // 때문에 queryRunner를 사용하게 될 때에는 이중 트랜잭션으로 인한 롤백 에러를 방지하기 위해,
    // 다른 방법으로 처리해준다.
    const feed: Feed = queryRunner.manager.create(Feed, feedInfo);
    return await queryRunner.manager.save(feed);
  }

  async getFeed(feedId: number, options: FeedOption = {}): Promise<Feed> {
    const queryBuilder: SelectQueryBuilder<Feed> = this.feedRepository
      .createQueryBuilder('feed')
      .select([
        'feed.id',
        'user.id',
        'user.nickname',
        'feed.title',
        'feed.content',
        'feed.viewCnt',
        'estimation.id',
        'estimation.estimation',
        'status.id',
        'status.is_status',
        'feed.created_at',
        'feed.updated_at',
        'feed.posted_at',
        'category.id',
        'category.category',
        'uploadFiles.id',
        'uploadFiles.is_img',
        'uploadFiles.file_link',
        'uploadFiles.file_name',
        'uploadFiles.file_size',
      ])
      .leftJoin('feed.user', 'user')
      .leftJoin('feed.category', 'category')
      .leftJoin('feed.estimation', 'estimation')
      .leftJoin('feed.status', 'status')
      .leftJoin('feed.uploadFiles', 'uploadFiles')
      .where('feed.id = :feedId', { feedId: feedId });
    // .withDeleted();
    // typeORM에서는 deleted_at이 null인 것만 가져오는 것이 default이기에 추가적인 where 구문을 입력할 필요가 없다.
    // 만약 deleted_at 컬럼 값이 있는 데이터도 가져오고 싶다면 .withDeleted() 메소드를 추가해주면 된다.

    if (options.isAll) {
    } else if (options.isTemp) {
      queryBuilder.andWhere('status.id = 2');
    } else {
      queryBuilder.andWhere('status.id = 1');
    }
    return await queryBuilder.getOneOrFail();
  }

  // 사용자별 피드의 총 개수 가져오기(임시저장 및 삭제된 게시글은 제외)
  async getFeedCountByUserId(userId: number): Promise<number> {
    // typeORM의 countBy 메소드를 이용한 간단한 기능구현
    // (단점은 Entity의 softDelete 기능으로 인한 'where feed.deleted_at IS NOT NULL' 쿼리가 무조건 들어간다.
    // 그리고 불필요한 join을 남발하는 query 실행결과를 확인하였다.
    // 때문에 아래의 createQueryBuilder를 이용한 query 구현을 사용한다.
    // const result = await this.countBy({
    //   user: { id: userId },
    //   status: { id: 1 },
    // });

    return await this.feedRepository
      .createQueryBuilder('feed')
      .select('feed.id')
      .where('feed.user = :userId', { userId: userId })
      .andWhere('feed.status = :statusId', { statusId: 1 })
      .withDeleted()
      .getCount();
  }

  // 피드의 symbol id별 count 가져오기
  async getFeedSymbolCount(feedId: number): Promise<FeedSymbolCount[]> {
    return await this.feedRepository
      .createQueryBuilder('feed')
      .select([
        'feed.id AS feedId',
        'feedSymbol.symbolId',
        'symbol.symbol AS symbol',
        'COUNT(feedSymbol.symbolId) AS count',
      ])
      .leftJoin('feed.feedSymbol', 'feedSymbol')
      .leftJoin('feedSymbol.symbol', 'symbol')
      .where('feed.id = :feedId', { feedId: feedId })
      .groupBy('feedSymbol.symbolId')
      .getRawMany();
  }

  async addViewCount(feedId: number): Promise<void> {
    await this.feedRepository
      .createQueryBuilder()
      .update(Feed)
      .set({
        viewCnt: () => 'viewCnt + 1',
        updated_at: () => 'updated_at',
      })
      .where('id = :feedId', { feedId: feedId })
      .execute();
  }
}
