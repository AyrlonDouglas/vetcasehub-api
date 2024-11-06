import { left } from '@common/core/either';
import { InspetorError } from '@common/core/inspetor';
import { VoteOnDiscussionError } from '@modules/discussion/application/useCases/voteOnDiscussion/voteOnDiscussion.errors';
import {
  VoteFor,
  VoteTypes,
} from '@modules/discussion/domain/component/voteManager.component';
import { Vote } from '@modules/discussion/domain/entities/vote/vote.entity';
import { DiscussionTestSetup } from '@modulesTest/discussion/test/DiscussionTest.setup';

describe('VoteOnDiscussion', () => {
  const makeSut = async () => {
    const {
      voteOnDiscussionUseCase,
      discusssionMock,
      userMock,
      userMock2,
      contextStorageService,
      voteRepository,
    } = await new DiscussionTestSetup().prepare();

    jest
      .spyOn(contextStorageService, 'get')
      .mockReturnValue({ props: { id: userMock2.props.id } });

    return {
      sut: voteOnDiscussionUseCase,
      discusssionMock,
      userMock,
      userMock2,
      contextStorageService,
      voteRepository,
    };
  };

  test('Should return left containg InspetorErroe when input is invalid', async () => {
    const { sut, discusssionMock } = await makeSut();

    const result1 = await sut.perform({ discussionId: '', voteType: 'down' });
    const result2 = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: '' as keyof typeof VoteTypes,
    });

    expect(result1.isLeft()).toBe(true);
    expect(result1.isLeft()).toBe(true);
    expect(result2.value).toBeInstanceOf(InspetorError);
    expect(result2.value).toBeInstanceOf(InspetorError);
  });

  test('Should return left containg InspetorErroe when voteType is not some type of VoteTypes', async () => {
    const { sut, discusssionMock } = await makeSut();

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: 'voteTypeInvalid' as keyof typeof VoteTypes,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InspetorError);
  });

  test('Should return left containing DiscussionNotFoundError when discussion not found', async () => {
    const { sut } = await makeSut();

    const result = await sut.perform({
      discussionId: '123',
      voteType: VoteTypes.up,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      VoteOnDiscussionError.DiscussionNotFoundError,
    );
  });

  test('Should return left containing CreatorCannotVoteYourDiscussion when the creator try vote your discussion', async () => {
    const { sut, discusssionMock, userMock, contextStorageService } =
      await makeSut();
    jest
      .spyOn(contextStorageService, 'get')
      .mockReturnValue({ props: { id: userMock.props.id } });

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.up,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      VoteOnDiscussionError.CreatorCannotVoteYourDiscussion,
    );
  });

  test('Should remove vote when vote already exists and voteType is equal input', async () => {
    const { sut, discusssionMock, voteRepository } = await makeSut();

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.up,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({ id: discusssionMock.props.id });
    expect(discusssionMock.props.upvotes).toBe(0);
    expect(discusssionMock.props.downvotes).toBe(0);
    expect(
      await voteRepository.findOneByFilter({
        voteFor: VoteFor.discussion,
        voteForReferency: discusssionMock.props.id,
      }),
    ).toBe(undefined);
  });

  test('Should exchange vote when vote already exists and voteType is difference input', async () => {
    const { sut, discusssionMock, voteRepository } = await makeSut();

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.down,
    });

    expect(result.isRight()).toBe(true);
    expect(discusssionMock.props.downvotes).toBe(1);
    expect(discusssionMock.props.upvotes).toBe(0);
    expect(result.value).toEqual({ id: discusssionMock.props.id });
    expect(
      await voteRepository.findOneByFilter({
        voteFor: VoteFor.discussion,
        voteForReferency: discusssionMock.props.id,
      }),
    ).toBeDefined();
  });

  test('Should return left when crete vote fails', async () => {
    const { sut, discusssionMock, voteRepository } = await makeSut();
    jest
      .spyOn(voteRepository, 'findOneByFilter')
      .mockReturnValueOnce(undefined);
    jest
      .spyOn(Vote, 'create')
      .mockReturnValueOnce(left(new InspetorError('some error')));

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.up,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InspetorError);
  });

  test('Should create upvote when vote not exists', async () => {
    const { sut, discusssionMock, voteRepository } = await makeSut();
    jest.spyOn(voteRepository, 'findOneByFilter').mockReturnValue(undefined);

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.up,
    });

    expect(result.isRight()).toBe(true);
    expect(discusssionMock.props.upvotes).toBe(2);
    expect(discusssionMock.props.downvotes).toBe(0);
    expect(result.value).toEqual({ id: discusssionMock.props.id });
  });

  test('Should create downvote when vote not exists', async () => {
    const { sut, discusssionMock, voteRepository } = await makeSut();
    jest.spyOn(voteRepository, 'findOneByFilter').mockReturnValue(undefined);

    const result = await sut.perform({
      discussionId: discusssionMock.props.id,
      voteType: VoteTypes.down,
    });

    expect(result.isRight()).toBe(true);
    expect(discusssionMock.props.upvotes).toBe(1);
    expect(discusssionMock.props.downvotes).toBe(1);
    expect(result.value).toEqual({ id: discusssionMock.props.id });
  });
});