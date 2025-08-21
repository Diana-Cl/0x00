import { Code2 } from "lucide-react"

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary rounded-lg">
            <Code2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-card-foreground">Coding Coach</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Code Review</p>
          </div>
        </div>
      </div>
    </header>
  )
}
