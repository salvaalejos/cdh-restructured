import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class Option extends Model {
  static table = 'options';

  @relation('questions', 'question_id') question: any;
  @field('server_id') serverId: number;
  @field('text') text: string;
  @field('image') image: string;
}
