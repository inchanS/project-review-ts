import { TempFeedDto } from '../entities/dto/tempFeed.dto';

interface TestSignIn {
  email: string;
  password: string;
}

interface TestUserInfo extends TestSignIn {
  id: number;
  nickname: string;
}

interface TestTempFeedDto extends Omit<Partial<TempFeedDto>, 'user'> {
  content: string;
}
