EXPLAIN WITH t1 AS (SELECT c.feedId AS feedId, COUNT(c.id) AS comment_cnt
            FROM comments c
                     LEFT JOIN users u ON u.id = c.userId
            GROUP BY c.feedId),
     t2 AS (SELECT fuF.id,
                   fuF.feedId,
                   uf.file_link AS img_url
            FROM feed_uploadFiles fuF
                     LEFT JOIN upload_files uf ON uf.id = fuF.uploadFilesId
            WHERE (fuF.feedId,
                   fuF.id)
                      IN (SELECT fuF.feedId,
                                 MAX(fuF.id)
                          FROM feed_uploadFiles fuF
                                   LEFT JOIN upload_files uf ON uf.id = fuF.uploadFilesId
                          WHERE uf.is_img = TRUE
                          GROUP BY feedId)),
     t3 AS (SELECT fuF2.feedId AS feedId, COUNT(f.id) AS files_cnt
            FROM feed_uploadFiles fuF2
                     LEFT JOIN upload_files f ON f.id = fuF2.uploadFilesId
            WHERE f.is_img = FALSE
            GROUP BY fuF2.feedId),
     t4 AS (SELECT feedId, COUNT(*) AS like_cnt FROM feed_symbol fs WHERE symbolId = 1 GROUP BY feedId)

SELECT f.id,
       f.categoryId,
       c2.category,
       f.title,
       f.content,
       t2.img_url,
       IFNULL(t4.like_cnt, 0),
       IFNULL(t3.files_cnt, 0),
       SUBSTRING(f.created_at, 1, 16)
FROM feeds f
         LEFT JOIN estimation e ON f.estimationId = e.id
         LEFT JOIN t1 ON t1.feedId = f.id
         LEFT JOIN categories c2 ON f.categoryId = c2.id
         LEFT JOIN t2 ON t2.feedId = f.id
         LEFT JOIN t3 ON t3.feedId = f.id
         LEFT JOIN t4 ON t4.feedId = f.id
