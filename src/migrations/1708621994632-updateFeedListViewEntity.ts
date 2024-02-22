import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFeedListViewEntity1708621994632
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
         WITH t1 AS (SELECT c.feedId AS feedId, COUNT(c.id) AS comment_cnt
                  FROM comments c
                  GROUP BY c.feedId),
           t2 AS (SELECT id,
                         feedId,
                         file_link AS img_url
                  FROM upload_files
                  WHERE (feedId,
                         id)
                            IN (SELECT feedId,
                                       MIN(id)
                                FROM upload_files
                                WHERE is_img = TRUE
                                  AND deleted_at IS NULL
                                GROUP BY feedId)),
           t3 AS (SELECT feedId AS feedId, COUNT(id) AS files_cnt
                  FROM upload_files
                  WHERE is_img = FALSE
                    AND deleted_at IS NULL
                  GROUP BY feedId),
           t4 AS (SELECT feedId, COUNT(*) AS like_cnt FROM feed_symbol fs WHERE symbolId = 1 GROUP BY feedId),
           t5 AS (SELECT feedId AS feedId, COUNT(id) AS img_cnt
                  FROM upload_files
                  WHERE is_img = TRUE
                    AND deleted_at IS NULL
                  GROUP BY feedId)


      SELECT f.id,
             f.statusId,
             f.categoryId,
             c2.category,
             u2.id                     AS userId,
             u2.nickname               AS userNickname,
             f.title,
             f.content,
             t2.img_url                AS imgUrl,
             f.viewCnt,
             IFNULL(t1.comment_cnt, 0) AS commentCnt,
             IFNULL(t4.like_cnt, 0)    AS likeCnt,
             IFNULL(t3.files_cnt, 0)   AS filesCnt,
             IFNULL(t5.img_cnt, 0)     AS imgCnt,
             f.created_at              AS createdAt,
             f.updated_at              AS updatedAt,
             f.posted_at               AS postedAt,
             f.deleted_at              AS deletedAt
      FROM feeds f
               LEFT JOIN estimation e ON f.estimationId = e.id
               LEFT JOIN t1 ON t1.feedId = f.id
               LEFT JOIN categories c2 ON f.categoryId = c2.id
               LEFT JOIN t2 ON t2.feedId = f.id
               LEFT JOIN t3 ON t3.feedId = f.id
               LEFT JOIN t4 ON t4.feedId = f.id
               LEFT JOIN t5 ON t5.feedId = f.id
               LEFT JOIN users u2 ON f.userId = u2.id
        `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
