import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/decorator/customize';
import type { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Token ko hợp lệ or ko có token ở Bearer Token ở header request',
        )
      );
    }

    //check permissions
    const targetMethod = request.method;
    const targetEndpoint = request.route?.path as string;

    const permissions = user?.permissions ?? [];
    let isExit = permissions.find(
      (permission) =>
        targetMethod === permission.method &&
        targetEndpoint === permission.apiPath,
    );

    if (targetEndpoint.startsWith('/api/v1/auth')) isExit = true;
    if (!isExit) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập endpoint này ( check permission )',
      );
    }

    return user;
  }
}
