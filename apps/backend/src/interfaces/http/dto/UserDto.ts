export interface RegisterUserDto {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface LoginUserDto {
  identifier: string; // email or username
  password: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponseDto {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
}

export interface RefreshTokenResponseDto {
  user: UserResponseDto;
  token: string;
  refreshToken: string;
}