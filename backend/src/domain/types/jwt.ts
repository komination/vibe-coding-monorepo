export interface JWTAccessTokenPayload {
  userId: string;
  email: string;
  username: string;
  type: 'access';
  iat?: number;
  exp?: number;
  iss?: string;
  sub?: string;
}

export interface JWTRefreshTokenPayload {
  userId: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
  iss?: string;
  sub?: string;
}

export type JWTTokenPayload = JWTAccessTokenPayload | JWTRefreshTokenPayload;

export function isAccessToken(payload: JWTTokenPayload): payload is JWTAccessTokenPayload {
  return payload.type === 'access';
}

export function isRefreshToken(payload: JWTTokenPayload): payload is JWTRefreshTokenPayload {
  return payload.type === 'refresh';
}