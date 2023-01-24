-- migrate:up
INSERT INTO feed_status (id, status) VALUES ('1', 'published');
INSERT INTO feed_status (id, status) VALUES ('2', 'temporary');
INSERT INTO feed_status (id, status) VALUES ('3', 'deleted');

INSERT INTO estimation (id, estimation) VALUES ('1', 'double like');
INSERT INTO estimation (id, estimation) VALUES ('2', 'like');

INSERT INTO symbol (id, symbol) VALUES ('1', 'like');
INSERT INTO symbol (id, symbol) VALUES ('2', 'I have it too');


-- migrate:down

