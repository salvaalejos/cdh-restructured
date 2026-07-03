import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';

export default class Question extends Model {
  static table = 'questions';

  @relation('surveys', 'survey_id') survey: any;
  @field('server_id') serverId: number;
  @field('text') text: string;
  @field('type_id') typeId: number;

  @children('options') options: any;
  @children('sub_options') subOptions: any;
  @children('answers') answers: any;
}
