// import { UserRepository } from '../../../repositories/user.repository';
// import { User } from '../../../entities/users.entity';
// import { FeedSymbolRepository } from '../../../repositories/feedSymbol.repository';
// import {
//   FeedListRepository,
//   FeedRepository,
// } from '../../../repositories/feed.repository';
// import { Comment } from '../../../entities/comment.entity';
// import { CommentRepository } from '../../../repositories/comment.repository';
// import { UserContentService } from '../../../services/users/userContent.service';
// import { FeedList } from '../../../entities/viewEntities/viewFeedList.entity';
//
// const userContentService = new UserContentService();
// describe('findUserInfoById', () => {
//   const userId: number = 1;
//   const user = new User();
//   user.id = userId;
//
//   afterEach(() => {
//     jest.restoreAllMocks();
//   });
//
//   test('사용자 정보 조회 - 실패: 사용자를 찾을 수 없을 때, 에러반환', async () => {
//     jest.spyOn(UserRepository.prototype, 'findOne').mockResolvedValueOnce(null);
//
//     await expect(
//       userContentService.findUserInfoByUserId(userId)
//     ).rejects.toMatchObject({
//       status: 404,
//       message: 'USER_IS_NOT_FOUND',
//     });
//   });
//
//   test('사용자 정보 조회 - 성공', async () => {
//     jest.spyOn(UserRepository.prototype, 'findOne').mockResolvedValue(user);
//
//     const result = await userContentService.findUserInfoByUserId(userId);
//
//     // 함수 과정 확인
//     expect(UserRepository.prototype.findOne).toBeCalledTimes(1);
//     expect(UserRepository.prototype.findOne).toBeCalledWith({
//       where: { id: userId },
//     });
//
//     // 함수 결과물 형식 확인 - User 객체로 반환되어야 한다.
//     expect(result instanceof User).toBe(true);
//     // 함수 결과물 값 확인 - id가 일치해야 한다.
//     expect(result.id).toEqual(userId);
//
//     // 사용자 정보 중, password는 반환하지 않는다.
//     expect(result.password).toEqual(undefined);
//   });
// });
//
// describe('findUserFeedsByUserId', () => {
//   const userId: number = 1;
//   const user = new User();
//   user.id = userId;
//
//   // 사용자의 피드는 3개라고 가정한다.
//   const userFeedCount: number = 3;
//   const userFeedList: FeedList[] = Array(userFeedCount)
//     .fill(null)
//     .map((_, index) => {
//       const userFeed = new FeedList();
//       userFeed.id = index + 1;
//       userFeed.userId = user.id;
//       userFeed.title = 'title';
//       userFeed.content = 'content';
//       userFeed.createdAt = new Date();
//       userFeed.updatedAt = new Date();
//
//       return userFeed;
//     });
//
//   beforeEach(() => {
//     jest.restoreAllMocks();
//
//     jest
//       .spyOn(FeedRepository.prototype, 'getFeedCountByUserId')
//       .mockResolvedValue(userFeedCount);
//
//     jest
//       .spyOn(FeedListRepository.prototype, 'getFeedListByUserId')
//       .mockResolvedValue(userFeedList);
//   });
//
//   test('사용자 게시물 조회 - 실패: userId가 전달되지 않았을 때, 에러메세지 반환', async () => {
//     try {
//       await userContentService.findUserFeedsByUserId(undefined, undefined);
//     } catch (error: any) {
//       expect(error.status).toEqual(400);
//       expect(error.message).toEqual('USER_ID_IS_UNDEFINED');
//     }
//   });
//
//   test.each([
//     { startIndex: undefined, limit: undefined },
//     { startIndex: 1, limit: undefined },
//     { startIndex: undefined, limit: 10 },
//   ])(
//     'page객체의 key중 하나라도 Number가 아닌 type으로 전달되었을 때, page = undefiend로 변환',
//     async page => {
//       await expect(
//         userContentService.findUserFeedsByUserId(userId, page)
//       ).toBeDefined();
//
//       expect(
//         FeedListRepository.prototype.getFeedListByUserId
//       ).toHaveBeenCalledWith(userId, undefined, undefined);
//     }
//   );
//
//   test.each([
//     { startIndex: 0, limit: 10 },
//     { startIndex: -1, limit: 10 },
//   ])(
//     '사용자 게시물 조회 - 실패: 페이지의 startIndex 파라미터가 1보다 작은 수로 전달되었을 때, 에러메세지 반환',
//     async wrongPage => {
//       await expect(
//         userContentService.findUserFeedsByUserId(userId, wrongPage)
//       ).rejects.toEqual({
//         status: 400,
//         message: 'PAGE_START_INDEX_IS_INVALID',
//       });
//     }
//   );
//
//   test.each([
//     { input: { startIndex: 1, limit: 4 }, expectedTotalPage: 1 },
//     { input: { startIndex: 2, limit: 2 }, expectedTotalPage: 2 },
//   ])(
//     '사용자 게시물 조회 - 성공: limit 값에 따른 totalPage 반환 확인',
//     async ({ input, expectedTotalPage }) => {
//       const result = await userContentService.findUserFeedsByUserId(
//         userId,
//         input
//       );
//
//       expect(result).toBeDefined();
//       expect(result.totalPage).toEqual(expectedTotalPage);
//     }
//   );
//
//   test('사용자 게시물 조회 - 성공: limit 값이 undefined일 때, totalPage = 1 반환 확인', async () => {
//     const result = await userContentService.findUserFeedsByUserId(userId, {
//       startIndex: 0,
//       limit: undefined,
//     });
//
//     expect(result).toBeDefined();
//     expect(result.totalPage).toEqual(1);
//   });
//
//   test('사용자 게시물 조회 - 성공', async () => {
//     const page = { startIndex: 2, limit: 2 };
//     const result = await userContentService.findUserFeedsByUserId(userId, page);
//
//     // 함수 과정 확인
//     expect(FeedRepository.prototype.getFeedCountByUserId).toBeCalledTimes(1);
//     expect(FeedRepository.prototype.getFeedCountByUserId).toBeCalledWith(
//       userId
//     );
//     expect(FeedListRepository.prototype.getFeedListByUserId).toBeCalledTimes(1);
//     expect(FeedListRepository.prototype.getFeedListByUserId).toBeCalledWith(
//       userId,
//       page,
//       undefined
//     );
//
//     // 함수 결과물 확인
//     expect(result).toBeDefined();
//     expect(result.feedCntByUserId).toEqual(userFeedCount);
//     expect(result.totalPage).toEqual(2);
//     expect(result.feedListByUserId).toEqual(userFeedList);
//   });
// });
//
// describe('findUserCommentsByUserId', () => {
//   const userId: number = 1;
//   const user = new User();
//   user.id = userId;
//
//   // 사용자의 댓글은 3개라고 가정한다.
//   const userCommentCount: number = 3;
//   //   // mySQL에서 출력되는 Date타입의 String 형식
//   const dateToString: string = '2021-01-01T00:00:00.000Z';
//   const userCommentList: Comment[] = Array(userCommentCount)
//     .fill(null)
//     .map((_, index) => {
//       const userComment: any = new Comment();
//       userComment.id = index + 1;
//       userComment.user = user;
//       userComment.comment = 'comment';
//       userComment.created_at = dateToString;
//       userComment.updated_at = dateToString;
//
//       return userComment;
//     });
//
//   beforeEach(() => {
//     jest.restoreAllMocks();
//
//     jest
//       .spyOn(CommentRepository.prototype, 'getCommentCountByUserId')
//       .mockResolvedValue(userCommentCount);
//
//     jest
//       .spyOn(CommentRepository.prototype, 'getCommentListByUserId')
//       .mockResolvedValue(userCommentList);
//   });
//
//   test('사용자 덧글 조회 - 실패: 사용자 정보가 전달되지 않았을 때, 에러메세지 반환', async () => {
//     await expect(
//       userContentService.findUserCommentsByUserId(undefined, undefined)
//     ).rejects.toEqual({
//       status: 400,
//       message: 'USER_ID_IS_UNDEFINED',
//     });
//   });
//
//   test.each([
//     { startIndex: undefined, limit: undefined },
//     { startIndex: 1, limit: undefined },
//     { startIndex: undefined, limit: 10 },
//   ])(
//     '사용자 덧글 조회 - 성공: page객체의 key중 하나라도 Number가 아닌 type으로 전달되었을 때, page = undefiend로 변환',
//     async page => {
//       await expect(
//         userContentService.findUserCommentsByUserId(userId, undefined, page)
//       ).toBeDefined();
//
//       expect(
//         CommentRepository.prototype.getCommentListByUserId
//       ).toHaveBeenCalledWith(userId, undefined);
//     }
//   );
//
//   test.each([
//     { input: { startIndex: 1, limit: 4 }, expectedTotalPage: 1 },
//     { input: { startIndex: 2, limit: 2 }, expectedTotalPage: 2 },
//   ])(
//     '사용자 덧글 조회 - 성공: limit 값에 따른 totalScrollCnt 반환 확인',
//     async ({ input, expectedTotalPage }) => {
//       const result = await userContentService.findUserCommentsByUserId(
//         userId,
//         undefined,
//         input
//       );
//
//       expect(result).toBeDefined();
//       expect(result.totalScrollCnt).toEqual(expectedTotalPage);
//     }
//   );
//
//   test('사용자 덧글 조회 - 성공: limit 값이 undefined일 때, totalScrollCnt = 1 반환 확인', async () => {
//     const result = await userContentService.findUserCommentsByUserId(
//       userId,
//       undefined,
//       { startIndex: 0, limit: undefined }
//     );
//
//     expect(result).toBeDefined();
//     expect(result.totalScrollCnt).toEqual(1);
//   });
//
//   test('사용자 덧글 조회 - 성공: 댓글의 날짜 정보들이 제대로 변환되어 반환되는지 확인', async () => {
//     const result = await userContentService.findUserCommentsByUserId(
//       userId,
//       undefined,
//       { startIndex: 0, limit: undefined }
//     );
//
//     expect(result).toBeDefined();
//     expect(result.commentListByUserId).toEqual(
//       userCommentList.map(comment => {
//         comment.created_at = new Date(dateToString);
//         comment.updated_at = new Date(dateToString);
//
//         return comment;
//       })
//     );
//   });
//
//   test('사용자 덧글 조회 - 성공: 비공개 댓글과 날짜 형식이 정상적으로 동작하는지 확인', async () => {
//     const loggedInUserId = 2;
//     const otherUserid = 3;
//
//     // 다른 사용자의 비공개 댓글
//     const comment1: any = {
//       is_private: true,
//       user: { id: userId },
//       comment: 'Original Comment',
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: null,
//       feed: { user: { id: otherUserid } },
//     };
//
//     // 다른 사용자의 삭제된 댓글
//     const comment2: any = {
//       is_private: false,
//       user: { id: userId },
//       comment: 'Original Comment',
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: dateToString,
//       feed: { user: { id: otherUserid } },
//     };
//
//     // 다른 사용자의 공개 댓글
//     const comment3: any = {
//       is_private: false,
//       user: { id: userId },
//       comment: 'Original Comment',
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: null,
//       feed: { user: { id: otherUserid } },
//     };
//
//     // 본인의 댓글에 대한 다른 사용자의 비공개 '대댓글'
//     const comment4: any = {
//       is_private: true,
//       user: { id: userId },
//       comment: 'Original Comment',
//       parent: { user: { id: loggedInUserId } },
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: null,
//       feed: { user: { id: otherUserid } },
//     };
//
//     // 본인의 게시글에 달린 다른 사용자의 비공개 댓글
//     const comment5: any = {
//       is_private: true,
//       user: { id: userId },
//       comment: 'Original Comment',
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: null,
//       feed: { user: { id: loggedInUserId } },
//     };
//
//     // 본인의 비공개 댓글
//     const comment6: any = {
//       is_private: true,
//       user: { id: loggedInUserId },
//       comment: 'Original Comment',
//       created_at: dateToString,
//       updated_at: dateToString,
//       deleted_at: null,
//       feed: { user: { id: otherUserid } },
//     };
//
//     CommentRepository.prototype.getCommentListByUserId = jest
//       .fn()
//       .mockResolvedValue([
//         comment1,
//         comment2,
//         comment3,
//         comment4,
//         comment5,
//         comment6,
//       ]);
//
//     // 아래 함수는 위 함수와 같이 작동, but, jest.spyOn을 사용하면, 과정 추적도 가능하다.
//     // 현재의 테스트에서는 단순 반환값만 모의하면 되기에 위 jest.fn()을 사용
//
//     // jest
//     //   .spyOn(CommentRepository, 'getCommentListByUserId')
//     //   .mockResolvedValue([
//     //     comment1,
//     //     comment2,
//     //     comment3,
//     //     comment4,
//     //     comment5,
//     //     comment6,
//     //   ]);
//
//     const result = await userContentService.findUserCommentsByUserId(
//       userId,
//       loggedInUserId,
//       { startIndex: undefined, limit: undefined }
//     );
//
//     expect(result).toBeDefined();
//     // 다른 사용자의 비공개 댓글
//     expect(result.commentListByUserId[0].comment).toBe('## PRIVATE_COMMENT ##');
//     // 다른 사용자의 삭제된 댓글
//     expect(result.commentListByUserId[1].comment).toBe('## DELETED_COMMENT ##');
//     // 다른 사용자의 공개 댓글
//     expect(result.commentListByUserId[2].comment).toBe('Original Comment');
//     // 본인의 댓글에 대한 다른 사용자의 비공개 '대댓글'
//     expect(result.commentListByUserId[3].comment).toBe('Original Comment');
//     // 본인의 게시글에 달린 다른 사용자의 비공개 댓글
//     expect(result.commentListByUserId[4].comment).toBe('Original Comment');
//     // 본인의 비공개 댓글
//     expect(result.commentListByUserId[5].comment).toBe('Original Comment');
//     // 모든 댓글이 반환되는지 확인
//     expect(result.commentListByUserId.length).toBe(6);
//   });
//
//   test('사용자 덧글 조회 - 성공: 모든 요소를 반환하는지 확인', async () => {
//     const comment: any = new Comment();
//     comment.created_at = dateToString;
//     comment.updated_at = dateToString;
//     comment.deleted_at = null;
//
//     CommentRepository.prototype.getCommentListByUserId = jest
//       .fn()
//       .mockResolvedValue([comment]);
//
//     const result = await userContentService.findUserCommentsByUserId(
//       userId,
//       undefined,
//       { startIndex: 0, limit: undefined }
//     );
//
//     expect(result).toBeDefined();
//     expect(result.commentListByUserId).toBeDefined();
//     expect(result.commentCntByUserId).toBeDefined();
//     expect(result.commentListByUserId).toBeDefined();
//   });
// });
//
// describe('findUserFeedSymbolsByUserId', () => {
//   const feedSymbolCnt = 10;
//   const feedSymbols = [{ id: 1 }, { id: 2 }];
//   const userId = 123;
//
//   beforeEach(() => {
//     jest.restoreAllMocks();
//
//     FeedSymbolRepository.prototype.getFeedSymbolCountByUserId = jest
//       .fn()
//       .mockResolvedValue(feedSymbolCnt);
//
//     FeedSymbolRepository.prototype.getFeedSymbolsByUserId = jest
//       .fn()
//       .mockResolvedValue(feedSymbols);
//   });
//
//   test('사용자의 게시물좋아요 표시 반환 - 실패: 사용자가 존재하지 않음', async () => {
//     const error = {
//       status: 400,
//       message: 'USER_ID_IS_UNDEFINED',
//     };
//
//     await expect(
//       userContentService.findUserFeedSymbolsByUserId(undefined, undefined)
//     ).rejects.toMatchObject(error);
//     await expect(
//       userContentService.findUserFeedSymbolsByUserId(null, undefined)
//     ).rejects.toMatchObject(error);
//   });
//
//   test.each([
//     { startIndex: 1, limit: undefined },
//     { startIndex: 1, limit: null },
//   ])(
//     '사용자의 게시물좋아요 표시 반환 - 성공: limit 값이 없을 경우, totalPage는 1이다.',
//     async page => {
//       const result = await userContentService.findUserFeedSymbolsByUserId(
//         userId,
//         page
//       );
//
//       expect(result.totalPage).toBe(1);
//     }
//   );
//
//   test.each([
//     { input: { startIndex: 1, limit: 10 }, output: 1 },
//     { input: { startIndex: 1, limit: 5 }, output: 2 },
//     { input: { startIndex: 1, limit: 2 }, output: 5 },
//     { input: { startIndex: 1, limit: 1 }, output: 10 },
//   ])(
//     '사용자의 게시물좋아요 표시 반환 - limit에 따른 totalPage 반환',
//     async ({ input, output }) => {
//       const result = await userContentService.findUserFeedSymbolsByUserId(
//         userId,
//         input
//       );
//
//       expect(result.totalPage).toBe(output);
//     }
//   );
//
//   test.each([
//     { startIndex: 0, limit: 10 },
//     { startIndex: -1, limit: 10 },
//   ])(
//     '사용자의 게시물좋아요 표시 반환 - 실패: page parameter가 정수일 때, startIndex가 1보다 작으면 에러 반환',
//     async page => {
//       await expect(
//         userContentService.findUserFeedSymbolsByUserId(userId, page)
//       ).rejects.toMatchObject({
//         status: 400,
//         message: 'PAGE_START_INDEX_IS_INVALID',
//       });
//     }
//   );
//
//   test('사용자의 게시물좋아요 표시 반환 - 성공', async () => {
//     const page = { startIndex: 1, limit: 10 };
//
//     const result = await userContentService.findUserFeedSymbolsByUserId(
//       userId,
//       page
//     );
//
//     expect(result.symbolCntByUserId).toBe(feedSymbolCnt);
//     expect(result.totalPage).toBe(1);
//     expect(result.symbolListByUserId).toEqual(feedSymbols);
//
//     expect(
//       FeedSymbolRepository.prototype.getFeedSymbolCountByUserId
//     ).toBeCalledWith(userId);
//     expect(
//       FeedSymbolRepository.prototype.getFeedSymbolsByUserId
//     ).toBeCalledWith(userId, page);
//   });
// });
