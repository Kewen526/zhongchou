import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 1) {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 JWT
    const payload = {
      sub: user.id.toString(),
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        username: user.username,
        role: user.role,
        modulePermissions: user.modulePermissions,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: BigInt(userId) },
    });

    if (!user || user.status !== 1) {
      return null;
    }

    return {
      id: user.id.toString(),
      username: user.username,
      role: user.role,
      parentId: user.parentId?.toString() || null,
      modulePermissions: user.modulePermissions,
    };
  }
}
