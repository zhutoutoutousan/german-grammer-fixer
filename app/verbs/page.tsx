'use client';

import { useState } from 'react';
import { Exercise, StreamResponse, generateVerbExercises } from '@/app/actions/generate-exercises';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GenerationProgress } from '@/components/ui/generation-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowRight, Book, CheckCircle2, Circle, Clock, Crown, GraduationCap, Sparkles, X } from 'lucide-react';
import { FloatingNav } from '@/components/ui/floating-nav';

type State = {
  status: 'idle' | 'generating' | 'parsing' | 'complete' | 'error';
  message: string;
};

type ExerciseWithUserInput = Exercise & {
  userAnswer?: string;
  isCorrect?: boolean;
  showAnswer?: boolean;
};

export default function VerbsPage() {
  const [verb, setVerb] = useState('');
  const [state, setState] = useState<State>({
    status: 'idle',
    message: ''
  });
  const [exercises, setExercises] = useState<ExerciseWithUserInput[]>([]);
  const [tables, setTables] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verb.trim()) return;

    setState({
      status: 'generating',
      message: `Generating exercises for "${verb}"...`
    });
    setExercises([]);
    setTables(null);

    try {
      const results = await generateVerbExercises(verb);
      
      for (const result of results) {
        switch (result.type) {
          case 'tables':
            setTables(result.data);
            break;
          case 'exercise':
            setExercises(prev => [...prev, { ...result.data, showAnswer: false }]);
            await new Promise(resolve => setTimeout(resolve, 500));
            break;
          case 'complete':
            setState(prev => ({
              ...prev,
              status: 'complete',
              message: result.data.message
            }));
            break;
          case 'error':
            setState({
              status: 'error',
              message: result.data.message
            });
            break;
        }
      }
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  const handleAnswerSubmit = (index: number, answer: string) => {
    setExercises(prev => prev.map((ex, i) => 
      i === index 
        ? { 
            ...ex, 
            userAnswer: answer,
            isCorrect: answer.trim().toLowerCase() === ex.answer.trim().toLowerCase(),
            showAnswer: true
          }
        : ex
    ));
  };

  const renderConjugationTable = (title: string, data: any) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Singular</TableHead>
              <TableHead>Plural</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {['1st Person', '2nd Person', '3rd Person'].map((person) => (
              <TableRow key={person}>
                <TableCell className="font-medium">{person}</TableCell>
                <TableCell>{data[`${person.toLowerCase()}_singular`]}</TableCell>
                <TableCell>{data[`${person.toLowerCase()}_plural`]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <FloatingNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              German Verb Mastery
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Perfect your German verb conjugations with AI-powered exercises
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4 items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
              <Input
                type="text"
                value={verb}
                onChange={(e) => setVerb(e.target.value)}
                placeholder="Enter a German verb (e.g. gehen)"
                className="text-lg"
              />
              <Button 
                type="submit" 
                disabled={state.status === 'generating'} 
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              >
                {state.status === 'generating' ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {state.status !== 'idle' && (
          <div>
            <GenerationProgress state={state} />
          </div>
        )}

        {(tables || exercises.length > 0) && (
          <div className="space-y-8">
            <Tabs defaultValue="conjugation" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="conjugation" className="space-x-2">
                  <Book className="h-4 w-4" />
                  <span>Conjugation Tables</span>
                </TabsTrigger>
                <TabsTrigger value="exercises" className="space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Practice Exercises</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="conjugation" className="mt-4">
                {tables && (
                  <div className="space-y-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Indicative Mood (Indikativ)</h3>
                      {renderConjugationTable("Present Tense (Präsens)", tables.present)}
                      {renderConjugationTable("Past Tense (Präteritum)", tables.preterite)}
                      {renderConjugationTable("Perfect Tense (Perfekt)", tables.perfect)}
                      {renderConjugationTable("Future Tense (Futur I)", tables.future)}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Subjunctive I (Konjunktiv I)</h3>
                      {renderConjugationTable("Present Subjunctive", tables.konjunktiv_i.present)}
                      {renderConjugationTable("Perfect Subjunctive", tables.konjunktiv_i.perfect)}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Subjunctive II (Konjunktiv II)</h3>
                      {renderConjugationTable("Past Subjunctive", tables.konjunktiv_ii.past)}
                      {renderConjugationTable("Future Subjunctive", tables.konjunktiv_ii.future)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Imperative Forms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Informal (du)</TableCell>
                                <TableCell>{tables.imperative?.du}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Formal (Sie)</TableCell>
                                <TableCell>{tables.imperative?.sie}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Plural (ihr)</TableCell>
                                <TableCell>{tables.imperative?.ihr}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Additional Forms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Infinitive</TableCell>
                                <TableCell>{tables.infinitive}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Past Participle</TableCell>
                                <TableCell>{tables.past_participle}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="exercises" className="mt-4">
                <div className="grid gap-4">
                  {exercises.map((exercise, index) => (
                    <Card
                      key={index}
                      className="bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Circle className="h-6 w-6 text-indigo-500" />
                          </div>
                          <div className="space-y-4 flex-grow">
                            <div>
                              <p className="text-lg font-medium mb-4">{exercise.sentence}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                                <Clock className="h-4 w-4" />
                                <span>{exercise.tense}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.mood || 'Indikativ'}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.person}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.number}</span>
                              </div>
                            </div>

                            {!exercise.showAnswer ? (
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  placeholder="Type your answer..."
                                  className="max-w-xs"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAnswerSubmit(index, e.currentTarget.value);
                                    }
                                  }}
                                />
                                <Button 
                                  onClick={(e) => {
                                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                    handleAnswerSubmit(index, input.value);
                                  }}
                                >
                                  Check
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  {exercise.isCorrect ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                  <span className={`font-medium ${exercise.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                    Your answer: {exercise.userAnswer}
                                  </span>
                                </div>
                                {!exercise.isCorrect && (
                                  <div className="flex items-center gap-2 text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="font-medium">
                                      Correct answer: {exercise.answer}
                                    </span>
                                  </div>
                                )}
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  {exercise.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
