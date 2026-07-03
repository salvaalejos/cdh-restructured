import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';

export default class Survey extends Model {
  static table = 'surveys';

  @field('server_survey_id') serverSurveyId: number;
  @field('assignment_id') assignmentId: number;
  @field('title') title: string;
  @field('description') description: string;
  @field('location') location: string;
  @field('status') status: number;
  @field('men_count') menCount: number;
  @field('women_count') womenCount: number;
  @field('server_completed_men') serverCompletedMen: number;
  @field('server_completed_women') serverCompletedWomen: number;
  @field('synced_at') syncedAt: string;

  @children('questions') questions: any;
  @children('respondents') respondents: any;
}
