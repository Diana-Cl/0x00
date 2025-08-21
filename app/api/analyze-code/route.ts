import { type NextRequest, NextResponse } from "next/server"

// Language detection based on file extension
function detectLanguage(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    py: "Python",
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React/JSX",
    tsx: "React/TypeScript",
    java: "Java",
    cpp: "C++",
    cc: "C++",
    cxx: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    swift: "Swift",
    kt: "Kotlin",
    scala: "Scala",
    r: "R",
    m: "Objective-C",
    h: "C/C++ Header",
    hpp: "C++ Header",
  }

  return languageMap[extension || ""] || ""
}

export async function POST(request: NextRequest) {
  try {
    const { filename, content } = await request.json()

    if (!content || !filename) {
      return NextResponse.json({ error: "Missing filename or content" }, { status: 400 })
    }

    const language = detectLanguage(filename)
    const languageContext = language ? `You are a ${language} code review expert. ` : ""
    const languageSpecificNote = language
      ? `Do not flag issues that are widely used and accepted patterns in ${language} even if it violates the criteria.`
      : ""

    const prompt = `${languageContext}Please analyze the following code and provide:

1. An overall score out of 100 based on code quality
2. Specific suggestions for improvement

Evaluation criteria:
1) Descriptive names - Use descriptive names for classes, functions, and variables
2) Function size - Functions should be focused. Try and avoid functions that are 200+ lines long. But also avoid small functions <5 lines of code if the function is only called once (unless it is a public function that is part of a class)
3) Make dependencies explicit - Avoid global state and hidden dependencies
4) Error handling - Generally try to avoid blanket swallowing all errors with empty try/catch blocks
5) Avoid too many levels of nesting of control structures/blocks. More than 2-3 levels is hard to follow
6) Make side effects obvious
7) Avoid magic numbers

${languageSpecificNote}

For each suggestion, include:
- Category (which criteria it relates to)
- Description of the issue
- Line number if applicable
- Code snippet showing the problematic code
- Severity (low, medium, high)

Please respond in JSON format:
{
  "score": number,
  "language": "${language}",
  "suggestions": [
    {
      "category": "string",
      "description": "string",
      "lineNumber": number,
      "codeSnippet": "string",
      "severity": "low|medium|high"
    }
  ]
}

Code to analyze:
\`\`\`
${content}
\`\`\``

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error("Gemini API error:", response.status, errorBody)
      return NextResponse.json({ error: "Failed to analyze code from Gemini API", details: errorBody }, { status: response.status })
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error("Unexpected Gemini API response structure:", data);
      return NextResponse.json({ error: "Unexpected Gemini API response structure" }, { status: 500 });
    }

    const jsonResponseString = data.candidates[0].content.parts[0].text.replace(/```json\n?|```/g, "")

    try {
      const jsonResponse = JSON.parse(jsonResponseString)
      return NextResponse.json(jsonResponse)
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response:", e)
      return NextResponse.json({ error: "Failed to parse JSON from Gemini response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error analyzing code:", error)
    return NextResponse.json({ error: "Failed to analyze code" }, { status: 500 })
  }
}
