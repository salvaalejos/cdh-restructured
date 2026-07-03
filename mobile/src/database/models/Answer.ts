import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class Answer extends Model {
  static table = 'answers';

  @relation('respondents', 'respondent_id') respondent: any;
  @relation('questions', 'question_id') question: any;
  @field('server_question_id') serverQuestionId: number;
  @field('server_option_id') serverOptionId: number;
  @field('server_sub_option_id') serverSubOptionId: number;
  @field('open_text') openText: string;
}
