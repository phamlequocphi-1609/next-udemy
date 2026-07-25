import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RolesService } from 'src/roles/roles.service';
import { IUser } from 'src/users/users.interface';

interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private roleService: RolesService,
  ) {
    const jwtSecret = configService.get<string>('JWT_ACCESS_TOKEN_SECRET');

    // quá trình giải mã token ( decoded )
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: IUser) {
    const { _id, email, name, role } = payload;
    // cần gắn thêm permission vào req.user
    const userRole = role as unknown as { _id: string; name: string };
    const temp = await this.roleService.findOne(userRole._id);

    return {
      _id,
      name,
      email,
      role,
      permissions: temp?.permissions ?? [],
    };
  }
}
