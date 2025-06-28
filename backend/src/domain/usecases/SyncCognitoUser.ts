import { User } from '@/domain/entities/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { CognitoJWTPayload } from './VerifyCognitoToken';

export interface SyncCognitoUserRequest {
  cognitoPayload: CognitoJWTPayload;
}

export interface SyncCognitoUserResponse {
  user: User;
  created: boolean;
}

export class SyncCognitoUserUseCase {
  constructor(
    private userRepository: UserRepository
  ) {}

  async execute(request: SyncCognitoUserRequest): Promise<SyncCognitoUserResponse> {
    const { cognitoPayload } = request;

    // Validate required fields
    if (!cognitoPayload.sub) {
      throw new Error('Invalid Cognito payload: missing subject');
    }

    if (!cognitoPayload.email) {
      throw new Error('Invalid Cognito payload: missing email');
    }

    // Check if user already exists by Cognito sub
    let user = await this.userRepository.findByCognitoSub(cognitoPayload.sub);
    
    if (user) {
      // User exists, sync profile information
      const needsUpdate = this.shouldUpdateProfile(user, cognitoPayload);
      
      if (needsUpdate) {
        user.updateProfile(
          cognitoPayload.name || user.name,
          cognitoPayload.picture || user.avatarUrl
        );
        user = await this.userRepository.update(user);
      }
      
      return {
        user,
        created: false,
      };
    }

    // Check if user exists by email (should not happen in Cognito-only system)
    const existingUserByEmail = await this.userRepository.findByEmail(cognitoPayload.email);
    
    if (existingUserByEmail) {
      // This shouldn't happen in a Cognito-only system, but if it does,
      // it's likely a data integrity issue
      throw new Error(
        `User with email ${cognitoPayload.email} already exists but with different Cognito sub. ` +
        `This indicates a data integrity issue that needs manual resolution.`
      );
    }

    // Create new Cognito user
    const username = await this.generateUniqueUsername(
      cognitoPayload.username || 
      cognitoPayload['cognito:username'] || 
      cognitoPayload.email.split('@')[0]
    );

    const newUser = User.createCognitoUser({
      email: cognitoPayload.email,
      username,
      cognitoSub: cognitoPayload.sub,
      name: cognitoPayload.name,
      avatarUrl: cognitoPayload.picture,
    });

    user = await this.userRepository.create(newUser);

    return {
      user,
      created: true,
    };
  }

  private shouldUpdateProfile(user: User, cognitoPayload: CognitoJWTPayload): boolean {
    // Check if we need to update the profile based on Cognito data
    const nameChanged = !!(cognitoPayload.name && cognitoPayload.name !== user.name);
    const avatarChanged = !!(cognitoPayload.picture && cognitoPayload.picture !== user.avatarUrl);
    
    return nameChanged || avatarChanged;
  }

  private async generateUniqueUsername(baseUsername: string): Promise<string> {
    // Sanitize username
    const sanitized = baseUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let username = sanitized || 'user'; // fallback if sanitized is empty
    let counter = 1;

    // Ensure username is not too short
    if (username.length < 3) {
      username = `user${Math.random().toString(36).substring(2, 7)}`;
    }

    // Check for uniqueness
    while (await this.userRepository.findByUsername(username)) {
      username = `${sanitized || 'user'}${counter}`;
      counter++;
    }

    return username;
  }
}

// Additional utility service for bulk user synchronization
export class BulkCognitoUserSyncService {
  constructor(
    private syncCognitoUserUseCase: SyncCognitoUserUseCase
  ) {}

  async syncUsersFromCognito(cognitoPayloads: CognitoJWTPayload[]): Promise<{
    synced: User[];
    created: User[];
    errors: { payload: CognitoJWTPayload; error: string }[];
  }> {
    const synced: User[] = [];
    const created: User[] = [];
    const errors: { payload: CognitoJWTPayload; error: string }[] = [];

    for (const payload of cognitoPayloads) {
      try {
        const result = await this.syncCognitoUserUseCase.execute({ cognitoPayload: payload });
        
        if (result.created) {
          created.push(result.user);
        } else {
          synced.push(result.user);
        }
      } catch (error) {
        errors.push({
          payload,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      synced,
      created,
      errors,
    };
  }
}