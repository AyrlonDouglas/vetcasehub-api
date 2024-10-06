import {
  findOneByFilterInput,
  VoteRepository,
} from '@modules/discussion/application/repositories/vote.repository';
import { Vote } from '@modules/discussion/domain/entities/vote/vote.entity';
import { Injectable } from '@nestjs/common';
import { VoteModel } from '../schemas/vote.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { VoteMapper } from '../mapper/vote.mapper';

@Injectable()
export class VoteMongooseRepository implements VoteRepository {
  private voteMapper = new VoteMapper();
  constructor(
    @InjectModel(VoteModel.name)
    private readonly voteModel: Model<VoteModel>,
  ) {}

  async findOneByFilter(filter: findOneByFilterInput): Promise<Vote> {
    const { user, voteFor, voteForReferency } = filter;

    const filterQuery: FilterQuery<VoteModel> = {
      user: user ? new Types.ObjectId(user) : undefined,
      voteFor,
      voteForReferency: voteForReferency
        ? new Types.ObjectId(voteForReferency)
        : undefined,
    };

    const vote = await this.voteModel.findOne(filterQuery);

    if (!vote) return;

    return this.voteMapper.toDomain({
      createdAt: vote.createdAt,
      id: vote.id,
      updatedAt: vote.updatedAt,
      user: vote.user.toString(),
      voteFor: vote.voteFor,
      voteForReferency: vote.voteForReferency.toString(),
      voteType: vote.voteType,
    });
  }

  async save(vote: Vote): Promise<string> {
    if (vote.props.id) {
      return this.update(vote);
    } else {
      return this.create(vote);
    }
  }

  async deleteById(id: string): Promise<number> {
    const isValidId = Types.ObjectId.isValid(id);
    if (!isValidId) return 0;

    const voteRemoved = await this.voteModel.deleteOne({ _id: id });

    return voteRemoved.deletedCount;
  }

  private async update(vote: Vote): Promise<string | null> {
    const updated = await this.voteModel.findByIdAndUpdate(
      vote.props.id,
      this.voteMapper.toPersistense(vote),
    );

    return updated.id;
  }

  private async create(vote: Vote): Promise<string> {
    const voteCreated = await this.voteModel.create(
      this.voteMapper.toPersistense(vote),
    );

    return voteCreated.id;
  }
}
