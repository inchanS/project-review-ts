interface TestSignIn {
  email: string;
  password: string;
}

interface TestUserInfo extends TestSignIn {
  id: number;
  nickname: string;
}
