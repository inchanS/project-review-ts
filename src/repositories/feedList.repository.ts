import { IsNull, Like, Not, Repository } from 'typeorm';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import dataSource from './data-source';
import { CustomError } from '../utils/util';
import { DateUtils } from '../utils/dateUtils';
import {
  ExtendedFeedlist,
  FeedListOptions,
  PageCondition,
  Pagination,
} from '../types/feedList';

export class FeedListRepository extends Repository<FeedList> {
  private static instance: FeedListRepository;
  private constructor() {
    super(FeedList, dataSource.createEntityManager());
  }
  public static getInstance(): FeedListRepository {
    if (!this.instance) {
      this.instance = new this();
    }
    return this.instance;
  }

  async getFeedList(
    categoryId: number | undefined,
    startIndex: number,
    limit: number,
    query?: string
  ): Promise<ExtendedFeedlist[]> {
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

    const originalResult: FeedList[] = await this.find({
      order: {
        postedAt: 'DESC',
        id: 'DESC',
      },
      skip: startIndex,
      take: limit,
      where,
    });

    const formatDateResult: ExtendedFeedlist[] =
      this.formatDateOfFeedList(originalResult);

    return formatDateResult;
  }

  async getFeedListByUserId(
    userId: number,
    page: Pagination | undefined,
    options: FeedListOptions = {}
  ): Promise<ExtendedFeedlist[]> {
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

    let pageCondition: PageCondition | undefined;
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

    const originalResult: FeedList[] = await this.find(findOption);
    const formatDateResult: ExtendedFeedlist[] =
      this.formatDateOfFeedList(originalResult);

    return formatDateResult;
  }

  formatDateOfFeedList(feedLists: FeedList[]): ExtendedFeedlist[] {
    return feedLists.map(
      (feedList: FeedList): ExtendedFeedlist => ({
        ...feedList,
        createdAt: DateUtils.formatDate(feedList.createdAt),
        updatedAt: DateUtils.formatDate(feedList.updatedAt),
        postedAt: feedList.postedAt
          ? DateUtils.formatDate(feedList.postedAt)
          : null,
        deletedAt: feedList.deletedAt
          ? DateUtils.formatDate(feedList.deletedAt)
          : null,
      })
    );
  }
}
