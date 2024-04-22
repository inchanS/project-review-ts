import { TempFeedDto } from '../entities/dto/tempFeed.dto';
import { FeedDto } from '../entities/dto/feed.dto';

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

interface TestFeedDto extends Omit<FeedDto, 'user'> {
  fileLinks?: string[];
}
