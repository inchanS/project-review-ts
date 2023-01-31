EXPLAIN SELECT c.id                           AS id,
       c.feedId                       AS feedId,
       c.userId                       AS userId,
       u.nickname                     AS nickname,
       c.comment                      AS comment,
       c.is_private                   AS isPrivate,
       c.is_deleted                   AS isDelete,
       SUBSTRING(c.created_at, 1, 16) AS createdAt,
       SUBSTRING(c.updated_at, 1, 16) AS updatedAt
FROM comments c
         LEFT JOIN users u ON u.id = c.userId