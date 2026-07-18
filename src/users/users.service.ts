import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserM, UserDocument } from './schema/user.schema';
import mongoose from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import type { SoftDeleteModel } from 'soft-delete-plugin-mongoose/dist/src';
import type { IUser } from './users.interface';
import { User } from 'src/decorator/customize';
import aqp from 'api-query-params';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserM.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  getHashPassword = (password: string) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    return hash;
  };

  async create(createUserDto: CreateUserDto, @User() user: IUser) {
    const { name, email, password, age, gender, address, role, company } =
      createUserDto;
    const isExit = await this.userModel.findOne({ email });
    if (isExit) {
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác.`,
      );
    }
    const hashPass = this.getHashPassword(password);
    const newUser = await this.userModel.create({
      email,
      password: hashPass,
      name,
      age,
      gender,
      address,
      role,
      company,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });
    return newUser;
  }

  async findAll(currentPage: number, limit: number, qs: string) {
    const { filter, sort, population } = aqp(qs);
    delete filter.current;
    delete filter.pageSize;

    let offset = (currentPage - 1) * +limit;
    let defaultLimit = +limit ? +limit : 10;

    const totalItem = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItem / defaultLimit);

    const result = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .select('-password')
      .populate(population)
      .exec();

    return {
      meta: {
        current: currentPage, // trang hiện tại
        pageSize: defaultLimit, // số lượng bản ghi đã lấy
        pages: totalPages, // tổng số trang với điều kiện query
        total: totalItem, // tổng số phần tử ( sổ bản ghi )
      },
      result, // kết quả query
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return 'not found user';
    return await this.userModel
      .findOne({
        _id: id,
      })
      .select('-password'); // exclude ( use - ) >< include
  }

  findOneByUsername(username: string) {
    return this.userModel.findOne({
      email: username,
    });
  }

  isValidPassword(password: string, hash: string) {
    return bcrypt.compareSync(password, hash);
  }

  async update(updateUserDto: UpdateUserDto, user: IUser) {
    const update = await this.userModel.updateOne(
      { _id: updateUserDto._id },
      {
        ...updateUserDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return update;
  }

  async remove(id: string, @User() user: IUser) {
    if (!mongoose.Types.ObjectId.isValid(id)) return 'not found user';
    await this.userModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
    return this.userModel.softDelete({ _id: id });
  }

  async register(user: RegisterUserDto) {
    const { address, age, email, gender, name, password } = user;
    const isExit = await this.userModel.findOne({ email });
    if (isExit) {
      // ném error 400
      throw new BadRequestException(
        `Email: ${email} đã tồn tại trên hệ thống. Vui lòng sử dụng email khác.`,
      );
    }
    const hashPassword = this.getHashPassword(password);
    let newRegister = await this.userModel.create({
      name,
      email,
      password: hashPassword,
      age,
      gender,
      address,
      role: 'USER',
    });
    return newRegister;
  }

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne({ _id }, { refreshToken });
  };

  findUserByToken = async (refreshToken: string) => {
    return await this.userModel.findOne({ refreshToken });
  };
}
