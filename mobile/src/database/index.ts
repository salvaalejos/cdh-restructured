import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import schema from './schema';
import Survey from './models/Survey';
import Question from './models/Question';
import Option from './models/Option';
import SubOption from './models/SubOption';
import Respondent from './models/Respondent';
import Answer from './models/Answer';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, /* Enable JSI for faster synchronous queries on Android/iOS */
  onSetUpError: error => {
    // Database failed to load -- offer the user to reload the app or log out
    console.error('WatermelonDB setup error', error);
  }
});

export const database = new Database({
  adapter,
  modelClasses: [
    Survey,
    Question,
    Option,
    SubOption,
    Respondent,
    Answer,
  ],
});
