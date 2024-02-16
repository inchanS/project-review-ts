import { Comment } from '../entities/comment.entity';

interface ExtendedComment
  extends Omit<
    Comment,
    'created_at' | 'updated_at' | 'deleted_at' | 'user' | 'children'
  > {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user: ExtendedUser;
  children?: ExtendedComment[];
}

interface ExtendedUser {
  id: number | null;
  nickname: string | null;
  email: string | null;
}
