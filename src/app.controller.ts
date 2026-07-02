import { Controller, Post, Body } from '@nestjs/common';
import { CompaniesService } from './companies/companies.service';
import { CreateCompanyDto } from './companies/dto/create-company.dto';

@Controller()
export class AppController {
  constructor(private readonly companyService: CompaniesService) {}

  @Post('/companies')
  createCompany(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companyService.create(createCompanyDto);
  }
}
