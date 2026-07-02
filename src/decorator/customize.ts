import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const RESPONSE_MESSAGE = 'response_message';

// định nghĩa decorator , nhờ vào metadata sẽ gán vào request , 1 thông tin đấy
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE, message);
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
