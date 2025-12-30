export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
}

export interface DatabaseConfig {
  uri: string;
}

export interface JwtConfig {
  accessSecret: string;
  accessExpiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface BcryptConfig {
  saltRounds: number;
}

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  description: string;
  version: string;
  path: string;
}

export interface CorsConfig {
  enabled: boolean;
  origin: string;
}

export interface Configuration {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  bcrypt: BcryptConfig;
  swagger: SwaggerConfig;
  cors: CorsConfig;
}
