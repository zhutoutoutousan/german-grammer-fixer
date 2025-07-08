'use client';

import { useState } from 'react';
import { Exercise, StreamResponse, generateAdjectiveExercises } from '@/app/actions/generate-exercises';
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

export default function AdjectivesPage() {
  const [adjective, setAdjective] = useState('');
  const [state, setState] = useState<State>({
    status: 'idle',
    message: ''
  });
  const [exercises, setExercises] = useState<ExerciseWithUserInput[]>([]);
  const [tables, setTables] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjective.trim()) return;

    setState({
      status: 'generating',
      message: `Generating exercises for "${adjective}"...`
    });
    setExercises([]);
    setTables(null);

    try {
      const results = await generateAdjectiveExercises(adjective);
      
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

  const renderDeclensionTable = (title: string, data: any) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Masculine</TableHead>
              <TableHead>Feminine</TableHead>
              <TableHead>Neuter</TableHead>
              <TableHead>Plural</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(data).map(([caseType, forms]: [string, any]) => (
              <TableRow key={caseType}>
                <TableCell className="font-medium capitalize">{caseType}</TableCell>
                <TableCell>{forms.masculine}</TableCell>
                <TableCell>{forms.feminine}</TableCell>
                <TableCell>{forms.neuter}</TableCell>
                <TableCell>{forms.plural}</TableCell>
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
              German Adjective Mastery
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Perfect your German adjective declensions with AI-powered exercises
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-4 items-center bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
              <Input
                type="text"
                value={adjective}
                onChange={(e) => setAdjective(e.target.value)}
                placeholder="Enter a German adjective (e.g. groß)"
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
            <Tabs defaultValue="declension" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="declension" className="space-x-2">
                  <Book className="h-4 w-4" />
                  <span>Declension Tables</span>
                </TabsTrigger>
                <TabsTrigger value="exercises" className="space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Practice Exercises</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="declension" className="mt-4">
                {tables && (
                  <div className="space-y-6">
                    {renderDeclensionTable("Definite Article Declension (der/die/das)", tables.definite_article)}
                    {renderDeclensionTable("Indefinite Article Declension (ein/eine)", tables.indefinite_article)}
                    {renderDeclensionTable("No Article Declension", tables.no_article)}
                    <Card>
                      <CardHeader>
                        <CardTitle>Comparative and Superlative Forms</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-2">Comparative</h4>
                            <p>{tables.comparative}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Superlative</h4>
                            <p>{tables.superlative}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{exercise.case}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.gender}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.number}</span>
                                <ArrowRight className="h-4 w-4" />
                                <span>{exercise.article_type}</span>
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
