import { Feed } from '../entities/feed.entity';
import { IsNull, Not, QueryRunner, Repository } from 'typeorm';
import dataSource from './data-source';

export interface FeedOption {
  isTemp?: boolean;
  isAll?: boolean;
}

interface FeedSymbolCount {
  feedId: number;
  symbolId: number;
  symbol: string;
  count: number;
}

export class FeedRepository extends Repository<Feed> {
  private static instance: FeedRepository;
  private constructor() {
    super(Feed, dataSource.createEntityManager());
  }
  public static getInstance(): FeedRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async createFeed(
    feedInfo: Feed,
    queryRunner: QueryRunner
  ): Promise<Feed | null> {
    // typeORM의 save, update 등의 메소드는 호출할때마다 새로운 트랜잭션을 자체적으로 시작한다.
    // 때문에 queryRunner를 사용하게 될 때에는 이중 트랜잭션으로 인한 롤백 에러를 방지하기 위해,
    // 다른 방법으로 처리해준다.
    const feed = queryRunner.manager.create(Feed, feedInfo);
    await queryRunner.manager.save(feed);

    const result: Feed | null = await queryRunner.manager.findOne(Feed, {
      loadRelationIds: true,
      where: { user: { id: feedInfo.user.id } },
      order: { id: 'DESC' },
    });

    return result;
  }

  async updateFeed(
    feedId: number,
    feedInfo: Feed,
    queryRunner: QueryRunner
  ): Promise<Feed | null> {
    await queryRunner.manager.update(Feed, feedId, feedInfo);

    return await queryRunner.manager.findOne(Feed, {
      loadRelationIds: true,
      where: { id: feedId },
    });
  }

  async getFeed(feedId: number, options: FeedOption = {}): Promise<Feed> {
    const queryBuilder = this.createQueryBuilder('feed')
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
      .where('feed.id = :feedId', { feedId: feedId })
      // TODO typeORM에서는 deleted_at이 null인 것만 가져오는 것이 기본이기 때문에,
      //  아래와 갈이 별도의 조건을 추가하지 않아도 될것 같은데? 확인 필요
      .andWhere('feed.deleted_at IS NULL');

    if (options.isAll) {
    } else if (options.isTemp) {
      queryBuilder.andWhere('feed.posted_at IS NULL');
    } else {
      queryBuilder.andWhere('feed.posted_at IS NOT NULL');
    }
    return await queryBuilder.getOneOrFail();
  }

  // 사용자별 피드의 총 개수 가져오기(임시저장 및 삭제된 게시글은 제외)
  async getFeedCountByUserId(userId: number): Promise<number> {
    return await this.countBy({
      user: { id: userId },
      posted_at: Not(IsNull()),
    });

    // return await this.createQueryBuilder('feed')
    //   .select(['COUNT(feed.id) as feedCnt', 'feed.user'])
    //   .where('feed.user = :userId', { userId: userId })
    //   .andWhere('feed.posted_at IS NOT NULL')
    //   .andWhere('feed.deleted_at IS NULL')
    //   .getRawOne();
  }

  // 피드의 symbol id별 count 가져오기
  async getFeedSymbolCount(feedId: number): Promise<FeedSymbolCount[]> {
    return await this.createQueryBuilder('feed')
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
    await this.createQueryBuilder()
      .update(Feed)
      .set({ viewCnt: () => 'viewCnt + 1' })
      .where('id = :feedId', { feedId: feedId })
      .execute();
  }
}
