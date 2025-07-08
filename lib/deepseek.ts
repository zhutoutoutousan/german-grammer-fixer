// Create a simple client for the DeepSeek API
export const deepseek = {
  chat: {
    completions: {
      create: async (params: {
        messages: Message[];
        model: string;
        response_format?: { type: string };
      }): Promise<ChatCompletionResponse> => {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            ...params,
            temperature: 0.7,
            max_tokens: 8000,
          }),
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        return response.json();
      }
    }
  }
};

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
  }[];
}

export interface Exercise {
  sentence: string;
  answer: string;
  case?: string;
  gender?: string;
  tense?: string;
  person?: string;
  number: string;
  mood?: string;
  article_type?: string;
  explanation?: string;
}

export type StreamResponse = 
  | { type: 'tables'; data: any }
  | { type: 'exercise'; data: Exercise }
  | { type: 'complete'; data: { message: string } }
  | { type: 'error'; data: { message: string } };

export type ProgressCallback = (chunk: string) => void;

export async function* createStreamingChatCompletion(
  messages: Message[]
): AsyncGenerator<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              buffer += parsed.choices[0].delta.content;
              
              // Try to find complete JSON objects in the buffer
              while (true) {
                const match = buffer.match(/\{[^{}]*\}/);
                if (!match) break;
                
                const jsonStr = match[0];
                buffer = buffer.slice(match.index! + jsonStr.length);
                
                try {
                  // Validate that it's a proper JSON object
                  JSON.parse(jsonStr);
                  yield jsonStr;
                } catch (e) {
                  // Not a valid JSON object, keep it in buffer
                  buffer = jsonStr + buffer;
                  break;
                }
              }
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    }
    
    // Try to process any remaining buffer
    if (buffer.trim()) {
      try {
        const match = buffer.match(/\{[^{}]*\}/);
        if (match) {
          const jsonStr = match[0];
          JSON.parse(jsonStr); // Validate JSON
          yield jsonStr;
        }
      } catch (e) {
        console.warn('Error parsing final buffer:', e);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function createChatCompletion(
  messages: Message[],
  onProgress?: ProgressCallback
): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 8000,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error('No response body received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              const content = parsed.choices[0].delta.content;
              fullResponse += content;
              onProgress?.(content);
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

export interface GermanExercise {
  sentence: string;
  answer: string;
  case?: string;
  gender?: string;
  tense?: string;
  person?: string;
  number: string;
  mood?: string;
  article_type?: string;
  explanation?: string;
}

export interface VerbConjugation {
  infinitive: string;
  present: { [key: string]: string };
  preterite: { [key: string]: string };
  perfect: { [key: string]: string };
  future: { [key: string]: string };
  subjunctive_i: { [key: string]: string };
  subjunctive_ii: { [key: string]: string };
  imperative: { [key: string]: string };
}

export interface AdjectiveDeclension {
  base_form: string;
  nominative: { [key: string]: string };
  accusative: { [key: string]: string };
  dative: { [key: string]: string };
  genitive: { [key: string]: string };
  comparative: string;
  superlative: string;
}

export interface GenerationProgress {
  status: 'generating' | 'parsing' | 'complete' | 'error';
  message: string;
  progress?: string;
}

export type GenerationProgressCallback = (progress: GenerationProgress) => void;

export async function* generateGermanExercises(
  type: 'adjective' | 'verb',
  word: string,
  onProgress?: GenerationProgressCallback
): AsyncGenerator<StreamResponse> {
  console.log(`\n=== Generating ${type} exercises for "${word}" ===`);
  
  onProgress?.({
    status: 'generating',
    message: `Generating ${type} exercises for "${word}"...`,
  });

  const systemPrompt = type === 'adjective' 
    ? `Du bist ein deutscher Grammatikexperte. Deine Aufgabe ist es, eine VOLLSTÄNDIGE Analyse des Adjektivs "${word}" zu erstellen.
WICHTIG: Antworte NUR mit einem JSON-Array im spezifizierten Format, ohne zusätzlichen Text.

Generiere ein Array mit ALLEN Formen in folgender Reihenfolge:
1. Zuerst die Deklinationstabelle als erstes Element
2. Dann EXAKT 32 Lückentextübungen für JEDE Form der Adjektivdeklination:

Singular (24 Übungen):
- Nominativ (6): Maskulin, Feminin, Neutrum (je bestimmt & unbestimmt)
- Akkusativ (6): Maskulin, Feminin, Neutrum (je bestimmt & unbestimmt)
- Dativ (6): Maskulin, Feminin, Neutrum (je bestimmt & unbestimmt)
- Genitiv (6): Maskulin, Feminin, Neutrum (je bestimmt & unbestimmt)

Plural (8 Übungen):
- Nominativ (2): bestimmt & unbestimmt
- Akkusativ (2): bestimmt & unbestimmt
- Dativ (2): bestimmt & unbestimmt
- Genitiv (2): bestimmt & unbestimmt`
    : `Du bist ein deutscher Grammatikexperte. Deine Aufgabe ist es, eine VOLLSTÄNDIGE Analyse des Verbs "${word}" zu erstellen.
WICHTIG: Antworte NUR mit einem JSON-Array im spezifizierten Format, ohne zusätzlichen Text.

Generiere ein Array mit ALLEN Formen in folgender Reihenfolge:
1. Zuerst die Konjugationstabelle als erstes Element
2. Dann EXAKT 50 Lückentextübungen für JEDE wichtige Verbform:

- Indikativ Aktiv (24):
  * Präsens (6): ich, du, er/sie/es, wir, ihr, sie/Sie
  * Präteritum (6): ich, du, er/sie/es, wir, ihr, sie/Sie
  * Perfekt (6): ich, du, er/sie/es, wir, ihr, sie/Sie
  * Plusquamperfekt (2): er/sie/es, wir
  * Futur I (2): er/sie/es, wir
  * Futur II (2): er/sie/es, wir

- Konjunktiv I (8):
  * Präsens (4): er/sie/es, wir (direkte & indirekte Rede)
  * Perfekt (4): er/sie/es, wir (direkte & indirekte Rede)

- Konjunktiv II (8):
  * Präsens/Würde (4): ich, er/sie/es, wir (mit & ohne würde)
  * Perfekt (4): ich, er/sie/es, wir (mit & ohne würde)

- Imperativ (4): du, ihr, Sie (mit & ohne Objekte)

- Passiv (6):
  * Präsens (2): er/sie/es, wir
  * Präteritum (2): er/sie/es, wir
  * Perfekt (2): er/sie/es, wir`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generiere das Array im folgenden Format:
[
  // Element 1: Tabelle
  {
    "type": "table",
    ${type === 'adjective' ? 
      `"declension_table": {
        "base_form": "${word}",
        "nominative": {
          "definite_m": "der große",
          "definite_f": "die große",
          "definite_n": "das große",
          "definite_pl": "die großen",
          "indefinite_m": "ein großer",
          "indefinite_f": "eine große",
          "indefinite_n": "ein großes",
          "indefinite_pl": "große"
        },
        // ... weitere Fälle ...
      }` :
      `"conjugation_table": {
        "infinitive": "${word}",
        "present": {
          "ich": "gehe",
          "du": "gehst",
          "er_sie_es": "geht",
          "wir": "gehen",
          "ihr": "geht",
          "sie_Sie": "gehen"
        },
        // ... weitere Zeiten ...
      }`
    }
  },

  // Element 2+: Übungen
  {
    "type": "exercise",
    "data": {
      "sentence": "${type === 'adjective' ? 'Der ___ Mann geht spazieren.' : 'Ich ___ jeden Tag zur Arbeit.'}",
      "answer": "${type === 'adjective' ? 'große' : 'gehe'}",
      ${type === 'adjective' ? 
        '"case": "Nominativ",\n      "gender": "maskulin",\n      "article_type": "definit",' : 
        '"tense": "Präsens",\n      "person": "1. Person",\n      "mood": "Indikativ",'}
      "number": "Singular",
      "explanation": "Erklärung der grammatischen Form"
    }
  }
]` }
  ];

  let responseText = '';
  const response = await createChatCompletion(messages, (chunk) => {
    responseText += chunk;
    onProgress?.({
      status: 'generating',
      message: `Generating ${type} exercises...`,
      progress: responseText
    });
  });

  try {
    // Find the array in the response
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      throw new Error('No JSON array found in response');
    }

    let jsonArray = arrayMatch[0]
      .replace(/,\s*]/g, ']') // Remove trailing commas
      .replace(/\}\s*\{/g, '},{') // Fix concatenated objects
      .replace(/\n/g, '') // Remove newlines
      .replace(/\r/g, '') // Remove carriage returns
      .trim();

    const items = JSON.parse(jsonArray);
    
    if (!Array.isArray(items)) {
      throw new Error('Response is not an array');
    }

    // First item should be the table
    const tableItem = items[0];
    if (tableItem?.type !== 'table') {
      throw new Error('First item is not a table');
    }

    yield {
      type: 'tables',
      data: type === 'adjective' ? tableItem.declension_table : tableItem.conjugation_table
    };

    // Rest are exercises
    for (let i = 1; i < items.length; i++) {
      const item = items[i];
      if (item?.type === 'exercise' && item?.data) {
        yield {
          type: 'exercise',
          data: item.data as Exercise
        };
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    yield {
      type: 'complete',
      data: {
        message: `Generated ${items.length - 1} exercises`
      }
    };
  } catch (error) {
    console.error('Error processing response:', error);
    console.error('Raw response:', response);
    yield {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'An error occurred'
      }
    };
  }
}

export async function correctGermanText(text: string): Promise<string> {
  const messages: Message[] = [
    { role: 'system', content: 'Du bist ein deutscher Grammatik- und Sprachexperte. Korrigiere den folgenden deutschen Text. Gib die korrigierte Version zurück und erkläre die Korrekturen in einer Liste darunter.' },
    { role: 'user', content: text }
  ];

  return createChatCompletion(messages);
}

export interface CalendarTask {
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

export interface CalendarRequest {
  type: 'calendar';
  tasks: CalendarTask[];
}

export function parseCalendarRequest(content: string): CalendarRequest | null {
  // Check if content contains time-related keywords
  const timeKeywords = /(before|after|at|around|from|to)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i;
  const dateKeywords = /(today|tomorrow|next week)/i;
  
  if (!timeKeywords.test(content) && !dateKeywords.test(content)) {
    return null;
  }

  // Split content into potential tasks
  const tasks = content.split(/[,.]\s+/).filter(task => 
    task.trim().length > 0 && 
    (timeKeywords.test(task) || dateKeywords.test(task))
  );

  if (tasks.length === 0) return null;

  const calendarTasks: CalendarTask[] = tasks.map(task => {
    // Extract time range if present (e.g., "from 12:00 to 1:30")
    const timeRangeMatch = task.match(/(?:from|between)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s+(?:to|until)\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);
    
    let startTime = new Date();
    let endTime = new Date();
    
    if (timeRangeMatch) {
      // Parse start and end times
      const startTimeStr = timeRangeMatch[1];
      const endTimeStr = timeRangeMatch[2];
      
      // Parse start time
      const [startHours, startMinutes] = parseTimeString(startTimeStr);
      startTime.setHours(startHours, startMinutes || 0);
      
      // Parse end time
      const [endHours, endMinutes] = parseTimeString(endTimeStr);
      endTime.setHours(endHours, endMinutes || 0);
      
      // If end time is earlier than start time, assume it's the next day
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }
    } else {
      // Single time point
      const timeMatch = task.match(timeKeywords);
      if (timeMatch) {
        const timeStr = timeMatch[2];
        const [hours, minutes] = parseTimeString(timeStr);
        startTime.setHours(hours, minutes || 0);
        endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1); // Default 1 hour duration
      }
    }

    // Parse date
    const dateMatch = task.match(dateKeywords);
    if (dateMatch) {
      const dateStr = dateMatch[1].toLowerCase();
      if (dateStr === 'tomorrow') {
        startTime.setDate(startTime.getDate() + 1);
        endTime.setDate(endTime.getDate() + 1);
      } else if (dateStr === 'next week') {
        startTime.setDate(startTime.getDate() + 7);
        endTime.setDate(endTime.getDate() + 7);
      }
    }

    // Extract title (everything before the time/date)
    const title = task.split(timeKeywords)[0].trim();

    return {
      title,
      start: startTime,
      end: endTime,
      description: task
    };
  });

  return {
    type: 'calendar',
    tasks: calendarTasks
  };
}

// Helper function to parse time strings like "12:00 PM" or "1:30"
function parseTimeString(timeStr: string): [number, number] {
  // Remove any extra spaces
  timeStr = timeStr.trim();
  
  // Check if it's in 12-hour format with AM/PM
  const ampmMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1]);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2]) : 0;
    const isPM = ampmMatch[3].toUpperCase() === 'PM';
    
    // Convert to 24-hour format
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    
    return [hours, minutes];
  }
  
  // Check if it's in 24-hour format
  const timeMatch = timeStr.match(/(\d{1,2})(?::(\d{2}))?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    
    // Assume 24-hour format if hours > 12
    if (hours <= 12) {
      // If hours <= 12, check if it's likely PM based on context
      // This is a heuristic - we assume times like "1" or "2" without AM/PM are PM
      if (hours < 12) hours += 12;
    }
    
    return [hours, minutes];
  }
  
  // Default to current time if parsing fails
  const now = new Date();
  return [now.getHours(), now.getMinutes()];
}

export function parseKnowledgeRequest(content: string): { title: string; content: string; connections: number[] } | null {
  // Simple parsing - first line is title, rest is content
  const lines = content.split('\n');
  if (lines.length < 2) return null;
  
  return {
    title: lines[0].trim(),
    content: lines.slice(1).join('\n').trim(),
    connections: [], // Connections will be managed separately
  };
} 