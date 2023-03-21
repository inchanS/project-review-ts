import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: `
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
                                GROUP BY feedId)),
           t3 AS (SELECT f.feedId AS feedId, COUNT(f.id) AS files_cnt
                  FROM upload_files f
                  WHERE f.is_img = FALSE
                  GROUP BY f.feedId),
           t4 AS (SELECT feedId, COUNT(*) AS like_cnt FROM feed_symbol fs WHERE symbolId = 1 GROUP BY feedId)

      SELECT f.id,
             f.statusId,
             f.categoryId,
             c2.category,
             u2.id                          AS userId,
             u2.nickname                    AS userNickname,
             f.title,
             f.content,
             t2.img_url                     AS imgUrl,
             f.viewCnt,
             IFNULL(t1.comment_cnt, 0)      AS commentCnt,
             IFNULL(t4.like_cnt, 0)         AS likeCnt,
             IFNULL(t3.files_cnt, 0)        AS filesCnt,
             SUBSTRING(f.created_at, 1, 19) AS createdAt,
             SUBSTRING(f.updated_at, 1, 19) AS updatedAt,
             SUBSTRING(f.posted_at, 1, 19)  AS postedAt,
             SUBSTRING(f.deleted_at, 1, 19) AS deletedAt
      FROM feeds f
               LEFT JOIN estimation e ON f.estimationId = e.id
               LEFT JOIN t1 ON t1.feedId = f.id
               LEFT JOIN categories c2 ON f.categoryId = c2.id
               LEFT JOIN t2 ON t2.feedId = f.id
               LEFT JOIN t3 ON t3.feedId = f.id
               LEFT JOIN t4 ON t4.feedId = f.id
               LEFT JOIN users u2 ON f.userId = u2.id
  `,
})
export class FeedList {
  @ViewColumn()
  id: number;

  @ViewColumn()
  categoryId: number;

  @ViewColumn()
  category: string;

  @ViewColumn()
  userId: number;

  @ViewColumn()
  userNickname: string;

  @ViewColumn()
  title: string;

  @ViewColumn()
  content: string;

  @ViewColumn()
  imgUrl: string;

  @ViewColumn()
  viewCnt: number;

  @ViewColumn()
  commentCnt: number;

  @ViewColumn()
  likeCnt: number;

  @ViewColumn()
  filesCnt: number;

  @ViewColumn()
  createdAt: Date;

  @ViewColumn()
  updatedAt: Date;

  @ViewColumn()
  postedAt: Date;

  @ViewColumn()
  deletedAt: Date;

  @ViewColumn()
  statusId: number;
}
