import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import ms, { StringValue } from 'ms';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { IUser } from 'src/users/users.interface';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { RolesService } from 'src/roles/roles.service';
import { permission } from 'process';
@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private roleService: RolesService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findOneByUsername(username);
    if (user) {
      const isValid = this.userService.isValidPassword(password, user.password);
      if (isValid) {
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.roleService.findOne(userRole._id);

        const objUser = {
          ...user.toObject(),
          permissions: temp?.permissions ?? [],
        };
        return objUser;
      }
    }
    return null;
  }

  async login(user: IUser, response: Response) {
    const { _id, email, name, role, permissions, company } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id,
      name,
      email,
      role,
      company,
    };
    const refresh_token = this.createRefreshToken(payload);

    // update user with refresh token
    await this.userService.updateUserToken(refresh_token, _id);

    // set refresh_token as cookies
    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(
        this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue,
      ), // miliseconds,
    });
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        name,
        email,
        role,
        permissions,
        company,
      },
    };
  }

  async register(user: RegisterUserDto) {
    let newUser = await this.userService.register(user);
    return {
      _id: newUser?._id,
      createdAt: newUser?.createdAt,
    };
  }

  createRefreshToken = (payload: any) => {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      // ms config wa milli onds
      expiresIn:
        ms(
          (this.configService.get<string>('JWT_REFRESH_EXPIRE') ||
            '1d') as StringValue,
        ) / 1000,
    });
    return refreshToken;
  };

  processNewToken = async (refreshToken: string, response: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      let user = await this.userService.findUserByToken(refreshToken);
      if (user) {
        // update refresh token
        const { _id, email, name, role, company } = user;
        const payload = {
          sub: 'token refresh',
          iss: 'from server',
          _id,
          name,
          email,
          role,
          company,
        };
        const refresh_token = this.createRefreshToken(payload);

        // update user with refresh token
        await this.userService.updateUserToken(refresh_token, _id.toString());

        // fetch user's role
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.roleService.findOne(userRole._id);
        // set refresh_token as cookies
        response.clearCookie('refresh_token');

        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(
            this.configService.get<string>('JWT_REFRESH_EXPIRE') as StringValue,
          ), // miliseconds,
        });
        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            name,
            email,
            role,
            permissions: temp?.permissions ?? [],
            company,
          },
        };
      } else {
        throw new BadRequestException(
          'Refresh token không hợp lệ. Vui lòng login',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        'Refresh token không hợp lệ. Vui lòng login',
      );
    }
  };

  logout = async (user: IUser, response: Response) => {
    await this.userService.updateUserToken('', user._id);
    response.clearCookie('refresh_token');
    return ' ok';
  };
}
