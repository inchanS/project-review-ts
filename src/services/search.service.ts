import { FeedRepository } from '../repositories/feed.repository';
import { Brackets } from 'typeorm';
import { FeedListRepository } from '../repositories/feedList.repository';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';
import { DateUtils } from '../utils/dateUtils';

export class SearchService {
  private feedRepository: FeedRepository;
  private feedListRepository: FeedListRepository;

  constructor() {
    this.feedRepository = FeedRepository.getInstance();
    this.feedListRepository = FeedListRepository.getInstance();
  }
  searchContent = async (query: string, index: number, limit: number) => {
    // query로 전달된 limit가 0이거나 없을 경우 기본값 5으로 변경 처리
    if (!limit || limit === 0) {
      limit = 5;
    }

    if (!index) {
      index = 0;
    }

    const titleSnippetLength: number = 10;
    const contentSnippetLength: number = 20;

    const result = await this.feedRepository
      .createQueryBuilder('feed')
      .select([
        'feed.id AS id',
        'feed.posted_at AS postedAt',
        `IF(LOWER(feed.title) LIKE LOWER(:query), CONCAT(
        IF(GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${titleSnippetLength}) > 1, '...', ''),
        
        SUBSTRING(feed.title, GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${titleSnippetLength} ), ${
          titleSnippetLength * 2 + query.length
        }),
        
        IF(LENGTH(feed.title) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${titleSnippetLength}) + ${
          titleSnippetLength * 2 + query.length
        }), '...', '')
      ), 
        CONCAT(
        SUBSTRING(feed.title, 1, ${titleSnippetLength * 2 + query.length}),
        IF(LENGTH(feed.title) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${titleSnippetLength}) + ${
          titleSnippetLength * 2 + query.length
        }), '...', '')
        )
      ) AS titleSnippet`,

        `IF(LOWER(feed.content) LIKE LOWER(:query), CONCAT(
        IF(GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${contentSnippetLength}) > 1, '...', ''),
      
        SUBSTRING(feed.content, GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${contentSnippetLength} ), ${
          contentSnippetLength * 2 + query.length
        }),
      
        IF(LENGTH(feed.content) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${contentSnippetLength}) + ${
          contentSnippetLength * 2 + query.length
        }), '...', '')
      ), 
      CONCAT(
        SUBSTRING(feed.content, 1, ${contentSnippetLength * 2 + query.length}),
        IF(LENGTH(feed.content) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${contentSnippetLength}) + ${
          contentSnippetLength * 2 + query.length
        }), '...', '')
        )
      ) AS contentSnippet`,
      ])
      .where(
        new Brackets(qb => {
          qb.where('feed.title LIKE :query', { query }).orWhere(
            'feed.content LIKE :query',
            { query }
          );
        })
      )
      .andWhere('feed.statusId = 1')
      .setParameter('query', `%${query}%`)
      .setParameter('originQuery', query)
      .orderBy('feed.posted_at', 'DESC')
      .orderBy('feed.id', 'DESC')
      .skip(index)
      .take(limit)
      .getRawMany();

    return DateUtils.processDateValues(result);
  };

  searchContentList = async (query: string, index: number, limit: number) => {
    // query로 전달된 limit가 0이거나 없을 경우 기본값 10으로 변경 처리
    if (!limit || limit === 0) {
      limit = 10;
    }

    if (!index) {
      index = 0;
    }

    let result: FeedList[] = await this.feedListRepository.getFeedList(
      undefined,
      index,
      limit,
      query
    );

    result = result.map((feed: FeedList) => {
      const lowerQuery: string = query.toLowerCase();

      let titleSnippet: string = feed.title;
      const titleIndex: number = titleSnippet.toLowerCase().indexOf(lowerQuery);

      if (titleIndex === -1) {
        titleSnippet = feed.title;
      } else {
        if (titleIndex >= 0) {
          const start: number = Math.max(titleIndex - 10, 0);
          const end: number = Math.min(
            titleIndex + lowerQuery.length + 10,
            titleSnippet.length
          );
          titleSnippet = titleSnippet.substring(start, end);
          if (start > 0) {
            titleSnippet = '...' + titleSnippet;
          }
          if (end < titleSnippet.length) {
            titleSnippet = titleSnippet + '...';
          }
        }
      }

      let contentSnippet: string = feed.content;
      const contentIndex: number = contentSnippet
        .toLowerCase()
        .indexOf(lowerQuery);

      if (contentIndex === -1) {
        contentSnippet = feed.content;
      } else {
        if (contentIndex >= 0) {
          const start: number = Math.max(contentIndex - 30, 0);
          const end: number = Math.min(
            contentIndex + lowerQuery.length + 30,
            contentSnippet.length
          );
          contentSnippet = contentSnippet.substring(start, end);
          if (start > 0) {
            contentSnippet = '...' + contentSnippet;
          }
          if (end < contentSnippet.length) {
            contentSnippet = contentSnippet + '...';
          }
        }
      }

      return {
        ...feed,
        title: titleSnippet,
        content: contentSnippet,
      };
    });

    return result;
  };
}
