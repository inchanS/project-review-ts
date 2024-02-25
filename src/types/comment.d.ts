import { User } from '../entities/users.entity';

interface ExtendedUser extends Omit<User, 'id' | 'nickname' | 'email'> {
  id: number | null;
  nickname: string | null;
  email: string | null;
}
