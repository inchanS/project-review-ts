import dataSource from './data-source';
import { Feed } from '../entities/feed.entity';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { IsNull, Like, Not, QueryRunner, Repository } from 'typeorm';
import { CustomError } from '../utils/util';

export type FeedOption = { isTemp?: boolean; isAll?: boolean };
export class FeedRepository extends Repository<Feed> {
  constructor() {
    super(Feed, dataSource.createEntityManager());
  }

  async createFeed(feedInfo: Feed, queryRunner?: QueryRunner) {
    // typeORM의 save, update 등의 메소드는 호출할때마다 새로운 트랜잭션을 시작한다.

    // 때문에 queryRunner를 사용하게 될 때에는 이중 트랜잭션으로 인한 롤백 에러를 방지하기 위해,
    // 다른 방법으로 처리해준다.
    if (queryRunner) {
      const feed = queryRunner.manager.create(Feed, feedInfo);
      await queryRunner.manager.save(Feed, feed);
    } else {
      const feed = this.create(feedInfo);
      await this.save(feed);
    }
    return await this.findOne({
      loadRelationIds: true,
      where: { user: { id: feedInfo.user.id } },
      order: { id: 'DESC' },
    });
  }

  async updateFeed(feedId: number, feedInfo: Feed) {
    await this.update(feedId, feedInfo);

    return await this.findOne({
      loadRelationIds: true,
      where: { id: feedId },
    });
  }

  async getFeed(feedId: number, options: FeedOption = {}) {
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
  async getFeedCountByUserId(userId: number) {
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
  async getFeedSymbolCount(feedId: number) {
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

  async addViewCount(feedId: number) {
    await this.createQueryBuilder()
      .update(Feed)
      .set({ viewCnt: () => 'viewCnt + 1' })
      .where('id = :feedId', { feedId: feedId })
      .execute();
  }
}

export type FeedListOptions = {
  includeTempFeeds?: boolean;
  onlyTempFeeds?: boolean;
};

export type Pagination = {
  startIndex: number;
  limit: number;
};
export class FeedListRepository {
  private repository: Repository<FeedList>;

  constructor() {
    this.repository = dataSource.getRepository(FeedList);
  }

  async getFeedList(
    categoryId: number | undefined,
    startIndex: number,
    limit: number,
    query?: string
  ) {
    let where: any = {
      categoryId: categoryId,
      postedAt: Not(IsNull()),
      deletedAt: IsNull(),
    };

    if (query) {
      where = [
        {
          ...where,
          title: Like(`%${query}%`),
        },
        {
          ...where,
          content: Like(`%${query}%`),
        },
      ];
    }

    return await this.repository.find({
      order: {
        postedAt: 'DESC',
      },
      skip: startIndex,
      take: limit,
      where,
    });
  }

  async getFeedListByUserId(
    userId: number,
    page: Pagination,
    options: FeedListOptions = {}
  ) {
    const { includeTempFeeds = false, onlyTempFeeds = false } = options;

    let feedListCondition = {};
    let orderOption = {};

    // includeTempFeeds는 사용자의 모든(임시, 정식) 게시글을 불러오기 위해 사용하며 사용자 계정삭제시 활용
    // onlyTempFeeds는 사용자의 임시게시글만 불러올 때 사용한다.

    // 아래 에러핸들링 코드는 현재의 로직으로는 작동되지 않지만, 혹시나 모를 코드의 논리적 오류를 제어하기 위해 추가하였다.
    if (includeTempFeeds && onlyTempFeeds) {
      throw new CustomError(
        400,
        'INCLUDE_TEMP_FEEDS_AND_ONLY_TEMP_FEEDS_CANNOT_BE_SET_TO_TRUE_AT_THE_SAME_TIME'
      );
    }

    if (includeTempFeeds) {
      // 없어도 되는 빈 if문이지만 코드 가독성을 위해 추가
      // 사용자의 정식 게시글 + 임시저장 게시글 목록 반환 (삭제된 글은 반환하지 않음)
    } else if (onlyTempFeeds) {
      // 사용자의 임시저장 게시글 목록만 반환
      feedListCondition = { postedAt: IsNull() };
      orderOption = { updatedAt: 'DESC' };
    } else {
      // 사용자의 정식 게시글 목록만 반환
      feedListCondition = { postedAt: Not(IsNull()) };
      orderOption = { postedAt: 'DESC' };
    }

    let pageCondition = {};
    if (page) {
      const startIndex: number = (page.startIndex - 1) * page.limit;

      pageCondition = {
        skip: startIndex,
        take: page.limit,
      };
    }

    const findOption = {
      where: { userId: userId, deletedAt: IsNull(), ...feedListCondition },
      order: orderOption,
      ...pageCondition,
    };

    return await this.repository.find(findOption);

    // --------------------------------------------------------------------------
    // 아래의 2 코드를 위 코드로 리팩토링 함 (2023.03.24) ---------------------------------

    //   if (includeTempFeeds) {
    //     return await this.find({
    //       where: { userId: userId, deletedAt: IsNull() },
    //     });
    //   } else {
    //     return await this.find({
    //       where: { userId: userId, postedAt: Not(IsNull()), deletedAt: IsNull() },
    //     });
    //   }
    // },
    //
    // async getTempFeedList(userId: number) {
    //   return await this.find({
    //     where: { userId: userId, postedAt: IsNull() },
    //   });
  }
}
