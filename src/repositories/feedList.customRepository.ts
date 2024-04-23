import { DataSource, Like, Repository } from 'typeorm';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { CustomError } from '../utils/util';

export class FeedListCustomRepository {
  private feedListRepository: Repository<FeedList>;

  constructor(private dataSource: DataSource) {
    this.feedListRepository = this.dataSource.getRepository(FeedList);
 }

  async getFeedList(
    categoryId: number | undefined,
    page: Pagination,
    query?: string
  ): Promise<FeedList[]> {
    let where: any = {
      categoryId: categoryId,
      statusId: 1,
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

    const result: FeedList[] = await this.feedListRepository.find({
      order: {
        postedAt: 'DESC',
        id: 'DESC',
      },
      skip: page.startIndex,
      take: page.limit,
      where,
    });

    return result;
  }

  async getFeedListByUserId(
    userId: number,
    page: Pagination | undefined,
    options: FeedListOptions = {}
  ): Promise<FeedList[]> {
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
      feedListCondition = { statusId: 2 };
      orderOption = { updatedAt: 'DESC' };
    } else {
      // 사용자의 정식 게시글 목록만 반환
      feedListCondition = { statusId: 1 };
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
      where: { userId: userId, ...feedListCondition },
      order: orderOption,
      ...pageCondition,
    };

    const result: FeedList[] = await this.feedListRepository.find(findOption);

    return result;
  }
}
