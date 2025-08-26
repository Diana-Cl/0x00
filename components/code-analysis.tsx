"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Info, CheckCircle, Loader2 } from "lucide-react"
import type { AnalysisResult } from "@/app/page"

interface CodeAnalysisProps {
  result: AnalysisResult | null
  isLoading: boolean
}

export function CodeAnalysis({ result, isLoading }: CodeAnalysisProps) {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-card rounded-lg p-8 border border-border text-center shadow-2xl">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-card-foreground">Analyzing Your Code</h3>
          <p className="text-sm text-muted-foreground">Hold your horses ...</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--success)"
    if (score >= 60) return "var(--warning)"
    return "var(--danger)"
  }

  const getSeverityIcon = (severity: "high" | "medium" | "low") => {
    switch (severity) {
      case "high":
        return <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--danger)" }} />
      case "medium":
        return <Info className="w-5 h-5 flex-shrink-0" style={{ color: "var(--warning)" }} />
      case "low":
        return <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "var(--primary)" }} />
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-6 text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-2 text-card-foreground">Overall Score</h2>
        <div className="text-6xl font-bold" style={{ color: getScoreColor(result.score) }}>
          {result.score}/100
        </div>
        <p dir="rtl" className="text-muted-foreground mt-3 max-w-2xl mx-auto">{result.summary}</p>
      </Card>

      <Card className="p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-card-foreground">Improvement Suggestions</h3>
        <div className="space-y-4">
          {result.improvements.map((item, index) => (
            <div key={index} className="bg-background/50 rounded-lg p-4 border border-border transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                {getSeverityIcon(item.severity)}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span dir="rtl" className="font-semibold text-card-foreground">{item.category}</span>
                    <Badge variant="secondary" className="capitalize">{item.severity}</Badge>
                  </div>
                  <p dir="rtl" className="text-sm text-muted-foreground mb-3">{item.issue}</p>

                  {item.codeSnippet && (
                    <div className="mb-3">
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto text-card-foreground border border-border">
                        <code>{item.codeSnippet}</code>
                      </pre>
                      {item.lineNumber && <p className="text-xs text-muted-foreground mt-1">Line: {item.lineNumber}</p>}
                    </div>
                  )}

                  <p dir="rtl" className="text-sm" style={{ color: 'var(--success)' }}>
                    <span className="font-semibold" style={{ color: 'var(--success)' }}>Suggestion:</span> {item.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
