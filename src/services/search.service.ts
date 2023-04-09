import { FeedRepository } from '../repositories/feed.repository';

const searchContent = async (query: string) => {
  const snippetLength = 20;

  const result = await FeedRepository.createQueryBuilder('feed')
    .select([
      'feed.id',
      'feed.title',
      `IF(LOWER(feed.content) LIKE LOWER(:query), SUBSTRING(feed.content, GREATEST(1, LOCATE(LOWER(:originQuery), LOWER(feed.content)) ), ${
        snippetLength * 2 + query.length
      }), "") AS contentSnippet`,
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
