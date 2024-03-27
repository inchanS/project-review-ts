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
  public searchContent = async (
    query: string,
    index: number,
    limit: number
  ) => {
    index = !isNaN(index) ? index : 0;
    limit = !isNaN(limit) ? limit : 5;

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

  public searchContentList = async (
    query: string,
    index: number,
    limit: number
  ): Promise<FeedList[]> => {
    index = !isNaN(index) ? index : 0;
    limit = !isNaN(limit) ? limit : 10;

    const result: FeedList[] = await this.feedListRepository.getFeedList(
      undefined,
      index,
      limit,
      query
    );
    const lowerQuery: string = query.toLowerCase();

    const titlePadding: number = 10;
    const contentPadding: number = 30;

    return result.map((feed: FeedList) => {
      return {
        ...feed,
        title: this.extractSnippet(feed.title, lowerQuery, titlePadding),
        content: this.extractSnippet(feed.content, lowerQuery, contentPadding),
      };
    });
  };

  private extractSnippet(
    source: string,
    searchTerm: string,
    padding: number
  ): string {
    const lowerSource: string = source.toLowerCase();
    const index: number = lowerSource.indexOf(searchTerm);

    if (index === -1) {
      return source;
    }

    const start: number = Math.max(index - padding, 0);
    const end: number = Math.min(
      index + searchTerm.length + padding,
      source.length
    );

    let snippet: string = source.substring(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < source.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }
}
