"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface CodeAnalysisProps {
  result: AnalysisResult | null
  isLoading: boolean
}

export function CodeAnalysis({ result, isLoading }: CodeAnalysisProps) {
  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-card-foreground">Analyzing Your Code</h3>
            <p className="text-muted-foreground">Our AI is reviewing your code for quality and maintainability...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!result) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-6 w-6 text-green-500" />
    if (score >= 60) return <AlertCircle className="h-6 w-6 text-yellow-500" />
    return <XCircle className="h-6 w-6 text-red-500" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getScoreIcon(result.score)}
            <div>
              <h3 className="text-xl font-semibold text-card-foreground">Code Quality Score</h3>
              {result.language && <p className="text-sm text-muted-foreground">Language: {result.language}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>{result.score}/100</div>
          </div>
        </div>
        <Progress value={result.score} className="h-3" />
      </Card>

      {/* Suggestions */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-card-foreground mb-4">Improvement Suggestions</h3>
        <div className="space-y-4">
          {result.suggestions.map((suggestion, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant={getSeverityColor(suggestion.severity)}>{suggestion.severity.toUpperCase()}</Badge>
                    <span className="font-medium text-card-foreground">{suggestion.category}</span>
                  </div>
                  <p className="text-muted-foreground mb-3">{suggestion.description}</p>
                  {suggestion.codeSnippet && (
                    <div className="bg-muted rounded-md p-3 font-mono text-sm">
                      <pre className="whitespace-pre-wrap text-card-foreground">{suggestion.codeSnippet}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
