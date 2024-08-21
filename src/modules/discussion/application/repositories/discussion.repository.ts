import { Discussion } from '@modules/discussion/domain/entities/discussion/discussion.entity';

export abstract class DiscussionRepository {
  abstract save(discussion: Discussion): Promise<string>;
  abstract findById(id: string): Promise<Discussion | null>;
}