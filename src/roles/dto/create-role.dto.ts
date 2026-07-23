import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  name: string;

  @IsNotEmpty({ message: 'Description không được để trống' })
  description: string;

  @IsNotEmpty({ message: 'isActive không được để trống' })
  isActive: boolean;

  @IsNotEmpty({ message: 'permissions không được để trống' })
  @IsMongoId({ each: true, message: 'each permission là mongo object id' })
  @IsArray({ message: 'permission có định dạng là array' })
  permissions: string[];
}
