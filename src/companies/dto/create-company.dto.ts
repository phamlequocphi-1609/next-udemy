import { IsNotEmpty } from 'class-validator';

// data transfer object
export class CreateCompanyDto {
  @IsNotEmpty({
    message: 'Name không được để trống',
  })
  name: string;

  @IsNotEmpty({
    message: 'Address không đươc để trống',
  })
  address: string;

  @IsNotEmpty({
    message: 'Description không đươc để trống',
  })
  description: string;

  @IsNotEmpty({
    message: 'Logo không được để trống',
  })
  logo: string;
}
