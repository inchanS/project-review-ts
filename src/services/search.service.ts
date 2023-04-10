import { FeedRepository } from '../repositories/feed.repository';

const searchContent = async (query: string) => {
  const snippetLength = 20;

  const result = await FeedRepository.createQueryBuilder('feed')
    .select([
      'feed.id',
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
    .where('feed.statusId = 1')
    .andWhere('feed.content LIKE :query', { query })
    .orWhere('feed.title LIKE :query', { query })
    .setParameter('query', `%${query}%`)
    .setParameter('originQuery', query)
    .getRawMany();

  return result;
};

export default { searchContent };
