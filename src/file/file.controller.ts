import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  FileValidator,
} from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResponseMessage } from 'src/decorator/customize';

export interface CustomUploadTypeValidatorOptions {
  fileType: RegExp;
}

export class CustomUploadTypeValidator extends FileValidator<CustomUploadTypeValidatorOptions> {
  buildErrorMessage(): string {
    return `Validation failed (expected type is ${this.validationOptions.fileType})`;
  }
  isValid(file: Express.Multer.File): boolean {
    if (!file) return false;
    const extension = file.originalname.split('.').pop() || '';
    return (
      this.validationOptions.fileType.test(file.mimetype) ||
      this.validationOptions.fileType.test(extension)
    );
  }
}

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @ResponseMessage('Upload single file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addValidator(
          new CustomUploadTypeValidator({
            fileType:
              /^(jpg|jpeg|png|image\/png|gif|txt|pdf|doc|docx|text\/plain|application\/pdf)$/i,
          }),
        )
        .addMaxSizeValidator({
          maxSize: 1024 * 1000, // tối đa 1MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY, // mã lỗi 422
        }),
    )
    file: Express.Multer.File,
  ) {
    return {
      fileName: file.filename,
    };
  }

  @Get()
  findAll() {
    return this.fileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.fileService.update(+id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileService.remove(+id);
  }
}
