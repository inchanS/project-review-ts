declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TYPEORM_CONNECTION: 'mysql' | 'mariadb';
      TYPEORM_PORT: number;
      SECRET_KEY: string;
      TYPEORM_LOGGING: boolean;
      TYPEORM_SYNCHRONIZE: boolean;
    }
  }

  namespace Express {
    interface Request {
      id?: number;
      userInfo?: userInfo;
    }
  }

  interface Error {
    status: number;
  }

  export class MissingDriverError extends Error {
    name = 'MissingDriverError';

    constructor(driverType: string) {
      super();
      Object.setPrototypeOf(this, MissingDriverError.prototype);
      this.message = `Wrong driver: "${driverType}" given. Supported drivers are: "cordova", "mariadb", "mongodb", "mssql", "mysql", "oracle", "postgres", "sqlite", "sqljs", "react-native".`;
    }
  }
}
export {};
