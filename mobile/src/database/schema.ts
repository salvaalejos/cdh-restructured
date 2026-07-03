import { appSchema, tableSchema } from '@nozbe/watermelondb'

// Schema v3: Añade server_completed_men/women para ajustar metas
// según progreso ya registrado en el servidor desde otros dispositivos.
export default appSchema({
  version: 3,
  tables: [
    tableSchema({
      name: 'surveys',
      columns: [
        { name: 'server_survey_id', type: 'number' },          // ID real en el backend
        { name: 'assignment_id', type: 'number' },              // ID de la asignación
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'location', type: 'string', isOptional: true },
        { name: 'status', type: 'number' },                    // 1=activa
        { name: 'men_count', type: 'number' },                 // Meta de hombres
        { name: 'women_count', type: 'number' },               // Meta de mujeres
        { name: 'server_completed_men', type: 'number', isOptional: true },  // Progreso del servidor
        { name: 'server_completed_women', type: 'number', isOptional: true },// Progreso del servidor
        { name: 'synced_at', type: 'string', isOptional: true }, // Timestamp ISO de última sync
      ]
    }),
    tableSchema({
      name: 'questions',
      columns: [
        { name: 'survey_id', type: 'string', isIndexed: true },
        { name: 'server_id', type: 'number' },              // ID real en el backend
        { name: 'text', type: 'string' },
        { name: 'type_id', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'options',
      columns: [
        { name: 'question_id', type: 'string', isIndexed: true },
        { name: 'server_id', type: 'number' },              // ID real en el backend
        { name: 'text', type: 'string' },
        { name: 'image', type: 'string', isOptional: true },
      ]
    }),
    tableSchema({
      name: 'sub_options',
      columns: [
        { name: 'question_id', type: 'string', isIndexed: true },
        { name: 'server_id', type: 'number' },              // ID real en el backend
        { name: 'text', type: 'string' },
      ]
    }),
    tableSchema({
      name: 'respondents',
      columns: [
        { name: 'survey_id', type: 'string', isIndexed: true },
        { name: 'surveyor_id', type: 'string' },
        { name: 'age', type: 'number', isOptional: true },
        { name: 'gender', type: 'string', isOptional: true },
        { name: 'schooling', type: 'string', isOptional: true },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
        { name: 'image_path', type: 'string', isOptional: true },
        { name: 'audio_path', type: 'string', isOptional: true },
        { name: 'is_cancelled', type: 'boolean' },
        // status: 0=en_progreso, 1=completado_local, 2=sincronizado_con_servidor
        { name: 'status', type: 'number' },
      ]
    }),
    tableSchema({
      name: 'answers',
      columns: [
        { name: 'respondent_id', type: 'string', isIndexed: true },
        { name: 'question_id', type: 'string', isIndexed: true },
        { name: 'server_question_id', type: 'number' },     // Para el payload de subida
        { name: 'server_option_id', type: 'number', isOptional: true },
        { name: 'server_sub_option_id', type: 'number', isOptional: true },
        { name: 'open_text', type: 'string', isOptional: true },
      ]
    })
  ]
})
