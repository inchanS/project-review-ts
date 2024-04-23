// import { User } from '../../../entities/users.entity';
// import { ValidatorService } from '../../../services/users/validator.service';
// import { UserRepository } from '../../../repositories/user.repository';
//
// const validatorService: ValidatorService = new ValidatorService();
//
// describe('unit test - checkDuplicateNickname ', () => {
//   afterEach(() => {
//     jest.restoreAllMocks();
//   });
//
//   test('닉네임 중복확인 - 실패: 네임이 잘못된 parameter로 전달되었을 때, 에러 반환', async () => {
//     // version1. 에러메세지만 확인하고자 할 때, 'toThrow' 사용
//     // await expect(
//     //   usersService.checkDuplicateNickname(undefined)
//     // ).rejects.toThrow('NICKNAME_IS_UNDEFINED');
//
//     // version2. 에러메세지와 에러코드를 확인하고자 할 때, 'toMatchObject' 사용
//     const errorObject = {
//       status: 400,
//       message: 'NICKNAME_IS_UNDEFINED',
//     };
//
//     await expect(
//       validatorService.checkDuplicateNickname(undefined)
//     ).rejects.toMatchObject(errorObject);
//     await expect(
//       validatorService.checkDuplicateNickname(null)
//     ).rejects.toMatchObject(errorObject);
//     await expect(
//       validatorService.checkDuplicateNickname('')
//     ).rejects.toMatchObject(errorObject);
//   });
//
//   test('닉네임 중복확인 - 성공: 중복이 아닌 닉네임이 전달되었을 때', async () => {
//     const nickname: string = 'newNickname';
//
//     jest
//       .spyOn(UserRepository.prototype, 'findByNickname')
//       .mockResolvedValueOnce(null);
//
//     const result = await validatorService.checkDuplicateNickname(nickname);
//
//     expect(result).toEqual({ message: 'AVAILABLE_NICKNAME' });
//     expect(UserRepository.prototype.findByNickname).toBeCalledTimes(1);
//     expect(UserRepository.prototype.findByNickname).toBeCalledWith(nickname);
//   });
//
//   test('전달된 닉네임이 중복일 때, 에러 반환', async () => {
//     const nickname: string = 'nickname';
//
//     const mockUser = new User();
//     mockUser.nickname = 'nickname';
//
//     jest
//       .spyOn(UserRepository.prototype, 'findByNickname')
//       .mockResolvedValueOnce(mockUser);
//
//     await expect(
//       validatorService.checkDuplicateNickname(nickname)
//     ).rejects.toMatchObject({
//       status: 409,
//       message: 'nickname_IS_NICKNAME_THAT_ALREADY_EXSITS',
//     });
//   });
// });
//
// describe('unit test - checkDuplicateEmail', () => {
//   afterEach(() => {
//     jest.restoreAllMocks();
//   });
//
//   test('이메일 중복확인 - 실패: 이메일이 undefined 일 때, 에러 반환', async () => {
//     const errorObject = {
//       status: 400,
//       message: 'EMAIL_IS_UNDEFINED',
//     };
//
//     await expect(
//       validatorService.checkDuplicateEmail(undefined)
//     ).rejects.toMatchObject(errorObject);
//
//     await expect(
//       validatorService.checkDuplicateEmail(null)
//     ).rejects.toMatchObject(errorObject);
//
//     await expect(
//       validatorService.checkDuplicateEmail('')
//     ).rejects.toMatchObject(errorObject);
//   });
//
//   test('이메일 중복확인 - 성공: 이메일 중복이 아닐 때', async () => {
//     const email: string = 'newEmail';
//
//     jest
//       .spyOn(UserRepository.prototype, 'findByEmail')
//       .mockResolvedValueOnce(null);
//
//     const result = await validatorService.checkDuplicateEmail(email);
//
//     expect(result).toEqual({ message: 'AVAILABLE_EMAIL' });
//     expect(UserRepository.prototype.findByEmail).toBeCalledTimes(1);
//     expect(UserRepository.prototype.findByEmail).toBeCalledWith(email);
//   });
//
//   test('이메일 중복확인 - 실패: 이메일 중복일 때, 에러 반환', async () => {
//     const email: string = 'email';
//
//     const mockUser = new User();
//     mockUser.email = 'email';
//
//     jest
//       .spyOn(UserRepository.prototype, 'findByEmail')
//       .mockResolvedValueOnce(mockUser);
//
//     await expect(
//       validatorService.checkDuplicateEmail(email)
//     ).rejects.toMatchObject({
//       status: 409,
//       message: 'email_IS_EMAIL_THAT_ALREADY_EXSITS',
//     });
//   });
// });
