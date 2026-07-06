import { IsNotEmpty } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

// data transfer object
export class UpdateCompanyDto extends CreateCompanyDto {}
// export class UpdateCompanyDto {
//   @IsNotEmpty({
//     message: 'Name không được để trống',
//   })
//   name: string;

//   @IsNotEmpty({
//     message: 'Address không đươc để trống',
//   })
//   address: string;

//   @IsNotEmpty({
//     message: 'Description không đươc để trống',
//   })
//   description: string;
// }
