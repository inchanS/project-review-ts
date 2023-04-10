import { FeedRepository } from '../repositories/feed.repository';
import { Brackets } from 'typeorm';

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

export default { searchContent };
