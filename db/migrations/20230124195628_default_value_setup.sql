-- migrate:up
INSERT INTO feed_status (id, is_status) VALUES (1, 'published');
INSERT INTO feed_status (id, is_status) VALUES (2, 'temporary');
INSERT INTO feed_status (id, is_status) VALUES (3, 'deleted');

INSERT INTO estimation (id, estimation) VALUES (1, 'double like');
INSERT INTO estimation (id, estimation) VALUES (2, 'like');
INSERT INTO estimation (id, estimation) VALUES (3, 'dislike');

INSERT INTO symbol (id, symbol) VALUES (1, 'like');
INSERT INTO symbol (id, symbol) VALUES (2, 'I have this too');

INSERT INTO categories(id, category, description) VALUES (1, '음식', '식당, 카페, 디저트 등');
INSERT INTO categories(id, category, description) VALUES (2, '전자제품', '스마트폰, 컴퓨터, 가전제품 등');
INSERT INTO categories(id, category, description) VALUES (3, '의류 및 악세서리', '패션, 의류, 신발, 가방, 액세서리 등');
INSERT INTO categories(id, category, description) VALUES (4, '화장품', '화장품, 향수, 뷰티 등');
INSERT INTO categories(id, category, description) VALUES (5, '컨텐츠', '영화, 드라마, 음악, 책, 만화, 이벤트 등');
INSERT INTO categories(id, category, description) VALUES (6, '여행', '여행, 관광지, 호텔, 숙박시설 등');
INSERT INTO categories(id, category, description) VALUES (7, '기타', '기타');




-- migrate:down
