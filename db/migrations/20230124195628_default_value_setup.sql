-- migrate:up
INSERT INTO feed_status (id, is_status) VALUES (1, 'published');
INSERT INTO feed_status (id, is_status) VALUES (2, 'temporary');
INSERT INTO feed_status (id, is_status) VALUES (3, 'deleted');

INSERT INTO estimation (id, estimation) VALUES (1, 'double like');
INSERT INTO estimation (id, estimation) VALUES (2, 'like');
INSERT INTO estimation (id, estimation) VALUES (3, 'nothing');

INSERT INTO symbol (id, symbol) VALUES (1, 'like');
INSERT INTO symbol (id, symbol) VALUES (2, 'I have this too');

INSERT INTO categories(id, category) VALUES (1, '1 Category');
INSERT INTO categories(id, category) VALUES (2, '2 Category');
INSERT INTO categories(id, category) VALUES (3, '3 Category');
INSERT INTO categories(id, category) VALUES (4, '4 Category');
INSERT INTO categories(id, category) VALUES (5, '5 Category');




-- migrate:down
