import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';

export default class Respondent extends Model {
  static table = 'respondents';

  @relation('surveys', 'survey_id') survey: any;
  @field('surveyor_id') surveyorId: string;
  @field('age') age: number;
  @field('gender') gender: string;
  @field('schooling') schooling: string;
  @field('latitude') latitude: number;
  @field('longitude') longitude: number;
  @field('image_path') imagePath: string;
  @field('audio_path') audioPath: string;
  @field('is_cancelled') isCancelled: boolean;
  // 0 = en_progreso | 1 = completado_local | 2 = sincronizado_con_servidor
  @field('status') status: number;

  @children('answers') answers: any;
}
