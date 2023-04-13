import {
  FeedListRepository,
  FeedRepository,
} from '../repositories/feed.repository';
import { Brackets } from 'typeorm';
import { FeedList } from '../entities/viewEntities/viewFeedList.entity';

const searchContent = async (query: string, index: number, limit: number) => {
  // query로 전달된 limit가 0이거나 없을 경우 기본값 5으로 변경 처리
  if (!limit || limit === 0) {
    limit = 5;
  }

  if (!index) {
    index = 1;
  }
  const startIndex: number = (index - 1) * limit;

  const snippetLength = 20;

  const result = await FeedRepository.createQueryBuilder('feed')
    .select([
      'feed.id AS id',
      'feed.posted_at AS postedAt',
      `IF(LOWER(feed.title) LIKE LOWER(:query), CONCAT(
        IF(GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${snippetLength}) > 1, '...', ''),
        SUBSTRING(feed.title, GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${snippetLength} ), ${
        snippetLength * 2 + query.length
      }),
        IF(LENGTH(feed.title) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.title)) - ${snippetLength}) + ${
        snippetLength * 2 + query.length
      }), '...', '')
      ), null) AS titleSnippet`,
      `IF(LOWER(feed.content) LIKE LOWER(:query), CONCAT(
        IF(GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${snippetLength}) > 1, '...', ''),
        SUBSTRING(feed.content, GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${snippetLength} ), ${
        snippetLength * 2 + query.length
      }),
        IF(LENGTH(feed.content) > (GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) - ${snippetLength}) + ${
        snippetLength * 2 + query.length
      }), '...', '')
      ), null) AS contentSnippet`,
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
    .skip(startIndex)
    .take(limit)
    .getRawMany();

  return result;
};

const searchContentList = async (
  query: string,
  index: number,
  limit: number
) => {
  // query로 전달된 limit가 0이거나 없을 경우 기본값 10으로 변경 처리
  if (!limit || limit === 0) {
    limit = 10;
  }

  if (!index) {
    index = 1;
  }
  const startIndex: number = (index - 1) * limit;

  let result = await FeedListRepository.getFeedList(
    undefined,
    startIndex,
    limit,
    query
  );

  result = result.map((feed: FeedList) => {
    const lowerQuery = query.toLowerCase();

    let titleSnippet = feed.title;
    const titleIndex = titleSnippet.toLowerCase().indexOf(lowerQuery);

    if (titleIndex === -1) {
      titleSnippet = feed.title;
    } else {
      if (titleIndex >= 0) {
        const start = Math.max(titleIndex - 10, 0);
        const end = Math.min(
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

    let contentSnippet = feed.content;
    const contentIndex = contentSnippet.toLowerCase().indexOf(lowerQuery);
    if (contentIndex === -1) {
      contentSnippet = feed.content;
    } else {
      if (contentIndex >= 0) {
        const start = Math.max(contentIndex - 30, 0);
        const end = Math.min(
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

export default { searchContent, searchContentList };