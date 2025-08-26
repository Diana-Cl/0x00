"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { CodeAnalysis } from "@/components/code-analysis"
import { Header } from "@/components/header"

export interface AnalysisResult {
  score: number;
  summary: string;
  improvements: Array<{
    category: string;
    issue: string;
    suggestion: string;
    severity: "high" | "medium" | "low";
    lineNumber?: number;
    codeSnippet?: string;
  }>;
}

import { AlertTriangle } from "lucide-react"

export default function Home() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleFileAnalysis = async (file: File, content: string) => {
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisError(null)

    try {
      const response = await fetch("/api/analyze-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          content: content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to analyze code")
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (error) {
      console.error("Error analyzing code:", error)
      setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Coding Coach</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your code and get AI-powered feedback to improve code quality, maintainability, and production
              readiness.
            </p>
          </div>

          <FileUpload onFileAnalysis={handleFileAnalysis} isAnalyzing={isAnalyzing} />

          {analysisError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 flex items-center gap-4">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h4 className="font-bold">Analysis Error</h4>
                <p className="text-sm">{analysisError}</p>
              </div>
            </div>
          )}

          {(analysisResult || isAnalyzing) && !analysisError && (
            <CodeAnalysis result={analysisResult} isLoading={isAnalyzing} />
          )}
        </div>
      </main>
    </div>
  )
}
