import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password, displayName } = registerDto;

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUsername = await this.usersService.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.usersService.create({
      email,
      username,
      passwordHash,
      profile: {
        displayName,
        avatarUrl: '',
        bio: '',
      },
      preferences: {
        defaultService: 'jamendo',
        theme: 'dark',
        autoplay: true,
        quality: 'medium',
      },
    });

    return this.generateTokens(String(user._id), user.username);
  }

  async login(loginDto: LoginDto) {
    const { emailOrUsername, password } = loginDto;

    let user = await this.usersService.findByEmail(emailOrUsername);
    if (!user) {
      user = await this.usersService.findByUsername(emailOrUsername);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(String(user._id), user.username);
  }

  async refreshTokens(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.generateTokens(String(user._id), user.username);
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { success: true };
  }

  private async generateTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') as any,
    });

    await this.usersService.updateRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
