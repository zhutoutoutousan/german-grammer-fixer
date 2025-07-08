'use server';

import { deepseek } from '@/lib/deepseek';

export type Exercise = {
  sentence: string;
  answer: string;
  explanation: string;
  tense?: string;
  person?: string;
  case?: string;
  gender?: string;
  number: string;
  article_type?: string;
  mood?: string;
};

export type StreamResponse = {
  type: 'tables' | 'exercise' | 'complete' | 'error';
  data: any;
};

export async function generateVerbExercises(verb: string): Promise<StreamResponse[]> {
  const responses: StreamResponse[] = [];
  
  try {
    // First get conjugation tables
    const tablesResponse = await deepseek.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a German language expert. Generate conjugation tables for verbs in a structured format.
The tables should include:
1. Present tense (Präsens)
2. Past tense (Präteritum)
3. Perfect tense (Perfekt)
4. Future tense (Futur I)
5. Subjunctive I (Konjunktiv I)
   - Present subjunctive
   - Perfect subjunctive
6. Subjunctive II (Konjunktiv II)
   - Past subjunctive
   - Future subjunctive
7. Imperative forms
8. Additional forms (infinitive, past participle)

For each tense/mood table, provide conjugations for all persons in both singular and plural forms.`
        },
        {
          role: 'user',
          content: `Generate complete conjugation tables for the German verb "${verb}" in JSON format.
Format it as nested objects with this structure:
{
  "present": {
    "1st_person_singular": "...",
    "2nd_person_singular": "...",
    "3rd_person_singular": "...",
    "1st_person_plural": "...",
    "2nd_person_plural": "...",
    "3rd_person_plural": "..."
  },
  "preterite": {
    // same structure as present
  },
  "perfect": {
    // same structure as present
  },
  "future": {
    // same structure as present
  },
  "konjunktiv_i": {
    "present": {
      // same structure as other tenses
    },
    "perfect": {
      // same structure as other tenses
    }
  },
  "konjunktiv_ii": {
    "past": {
      // same structure as other tenses
    },
    "future": {
      // same structure as other tenses
    }
  },
  "imperative": {
    "du": "...",
    "sie": "...",
    "ihr": "..."
  },
  "infinitive": "...",
  "past_participle": "..."
}`
        }
      ],
      model: 'deepseek-chat',
      response_format: { type: 'json_object' }
    });

    const tables = JSON.parse(tablesResponse.choices[0].message.content);
    responses.push({ type: 'tables', data: tables });

    // Then generate exercises
    const exerciseResponse = await deepseek.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a German language expert. Generate verb conjugation exercises that cover all tenses, moods, and persons.
Each exercise must include:
1. A German sentence with a gap for the verb
2. The correct answer (verb in proper form)
3. The tense being used
4. The mood (Indikativ, Konjunktiv I, or Konjunktiv II)
5. The person (1st, 2nd, or 3rd)
6. The number (singular or plural)
7. A clear explanation of why this form is used, especially for subjunctive moods`
        },
        {
          role: 'user',
          content: `Generate 32 diverse exercises for the German verb "${verb}" in JSON format.
Include exercises for:
- All indicative tenses (Präsens, Präteritum, Perfekt, Futur I)
- Konjunktiv I (present and perfect)
- Konjunktiv II (past and future)
- All persons (1st, 2nd, 3rd)
- Both numbers (singular, plural)
- Some imperative forms
- Some modal verb combinations

Make sure to include plenty of subjunctive mood exercises with common use cases like:
- Reported speech (Konjunktiv I)
- Hypothetical situations (Konjunktiv II)
- Polite requests (Konjunktiv II)
- Wishes and desires (Konjunktiv II)

Format each exercise as:
{
  "sentence": "Er sagte, er ___ morgen kommen.",
  "answer": "werde",
  "tense": "Präsens",
  "mood": "Konjunktiv I",
  "person": "3rd Person",
  "number": "singular",
  "explanation": "In reported speech (indirekte Rede), we use Konjunktiv I. The present subjunctive of 'werden' in 3rd person singular is 'werde'."
}`
        }
      ],
      model: 'deepseek-chat',
      response_format: { type: 'json_object' }
    });

    const exercises = JSON.parse(exerciseResponse.choices[0].message.content);
    for (const exercise of exercises.exercises) {
      responses.push({ type: 'exercise', data: exercise });
    }

    responses.push({
      type: 'complete',
      data: { message: `Successfully generated exercises for "${verb}"` }
    });

  } catch (error) {
    responses.push({
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'An error occurred' }
    });
  }

  return responses;
}

export async function generateAdjectiveExercises(adjective: string): Promise<StreamResponse[]> {
  const responses: StreamResponse[] = [];
  
  try {
    // First get declension tables
    const tablesResponse = await deepseek.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a German language expert. Generate declension tables for adjectives in a structured format.
The table should include:
1. Definite article declensions (der/die/das)
2. Indefinite article declensions (ein/eine)
3. Without article declensions
4. Plural forms for all cases
Each table should show all cases (Nominative, Accusative, Dative, Genitive) and all genders (masculine, feminine, neuter).`
        },
        {
          role: 'user',
          content: `Generate complete declension tables for the German adjective "${adjective}" in JSON format. 
Format it as nested objects with this structure:
{
  "definite_article": {
    "nominative": {
      "masculine": "...",
      "feminine": "...",
      "neuter": "...",
      "plural": "..."
    },
    "accusative": {...},
    "dative": {...},
    "genitive": {...}
  },
  "indefinite_article": {
    // same structure as definite
  },
  "no_article": {
    // same structure as definite
  },
  "comparative": "...",
  "superlative": "..."
}`
        }
      ],
      model: 'deepseek-chat',
      response_format: { type: 'json_object' }
    });

    const tables = JSON.parse(tablesResponse.choices[0].message.content);
    responses.push({ type: 'tables', data: tables });

    // Then generate exercises
    const exerciseResponse = await deepseek.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a German language expert. Generate adjective declension exercises that cover all cases, genders, and article types.
Each exercise must include:
1. A German sentence with a gap for the adjective
2. The correct answer (adjective with proper ending)
3. The grammatical case
4. The gender (for singular) or specify "plural"
5. The article type used (definite, indefinite, or no article)
6. A clear explanation of why this ending is used`
        },
        {
          role: 'user',
          content: `Generate 32 diverse exercises for the German adjective "${adjective}" in JSON format. 
Include exercises for:
- All cases (Nominative, Accusative, Dative, Genitive)
- All genders (masculine, feminine, neuter, plural)
- All article types (definite, indefinite, no article)
- Some comparative and superlative forms

Format each exercise as:
{
  "sentence": "Der ___ Mann geht.",
  "answer": "${adjective}e",
  "case": "Nominative",
  "gender": "masculine",
  "number": "singular",
  "article_type": "definite",
  "explanation": "With definite article 'der' (masculine, nominative), the adjective takes the -e ending"
}`
        }
      ],
      model: 'deepseek-chat',
      response_format: { type: 'json_object' }
    });

    const exercises = JSON.parse(exerciseResponse.choices[0].message.content);
    for (const exercise of exercises.exercises) {
      responses.push({ type: 'exercise', data: exercise });
    }

    responses.push({
      type: 'complete',
      data: { message: `Successfully generated exercises for "${adjective}"` }
    });

  } catch (error) {
    responses.push({
      type: 'error',
      data: { message: error instanceof Error ? error.message : 'An error occurred' }
    });
  }

  return responses;
}
