import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, PenTool } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">German Grammar Fixer</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verbessern Sie Ihre deutsche Grammatik mit KI-generierten Übungen für Adjektive und Verben
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-blue-600" />
                Adjektiv-Übungen
              </CardTitle>
              <CardDescription>
                Üben Sie deutsche Adjektivdeklination mit verschiedenen Fällen, Geschlechtern und Zahlen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/adjectives">
                <Button className="w-full">Adjektive üben</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-6 w-6 text-green-600" />
                Verb-Übungen
              </CardTitle>
              <CardDescription>Konjugieren Sie deutsche Verben in verschiedenen Zeiten und Modi</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/verbs">
                <Button className="w-full">Verben üben</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
