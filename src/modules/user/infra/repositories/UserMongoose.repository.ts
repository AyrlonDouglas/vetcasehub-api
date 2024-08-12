import { UserRepository } from '@modules/user/application/repositories/user.repository';
import User from '@modules/user/domain/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from '../schemas/user.schema';
import { UserMongooseMapper } from '../mappers/user.mapper';

@Injectable()
export default class UserMongooseRepository implements UserRepository {
  mapper: UserMongooseMapper;

  constructor(
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
  ) {
    this.mapper = new UserMongooseMapper();
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (!user) return null;
    return this.mapper.toDomain(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;
    return this.mapper.toDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) return null;
    return this.mapper.toDomain(user);
  }

  async save(user: User): Promise<string> {
    const userToPersistence = this.mapper.toPersistense(user);
    console.log(userToPersistence);
    const createdUser = new this.userModel(userToPersistence);
    const savedUser = await createdUser.save();
    return savedUser._id.toString();
  }

  async removeById(id: string): Promise<string | null> {
    const removedUser = await this.userModel.findByIdAndDelete(id);
    if (!removedUser) return null;
    return removedUser.id;
  }

  async findAll(): Promise<User[]> {
    throw new Error('Method not implemented.');
  }
}
