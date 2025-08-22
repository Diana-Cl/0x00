import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type, ApiError } from "@google/genai"

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

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 })
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

Please respond in JSON format.

Code to analyze:
\`\`\`
${content}
\`\`\``

    const ai = new GoogleGenAI({})

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        language: { type: Type.STRING },
        suggestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              lineNumber: { type: Type.NUMBER },
              codeSnippet: { type: Type.STRING },
              severity: { type: Type.STRING },
            },
            required: ["category", "description", "lineNumber", "codeSnippet", "severity"],
          },
        },
      },
      required: ["score", "language", "suggestions"],
    }

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (
      !result ||
      !result.candidates ||
      !Array.isArray(result.candidates) ||
      result.candidates.length === 0 ||
      !result.candidates[0].content ||
      !result.candidates[0].content.parts ||
      !Array.isArray(result.candidates[0].content.parts) ||
      result.candidates[0].content.parts.length === 0 ||
      !result.candidates[0].content.parts[0].text
    ) {
      console.error("Unexpected response structure from Gemini API:", JSON.stringify(result, null, 2));
      return NextResponse.json({ error: "Unexpected response structure from Gemini API" }, { status: 500 });
    }

    const jsonText = result.candidates[0].content.parts[0].text;
    const jsonResponse = JSON.parse(jsonText);

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error analyzing code:", error)
    if (error instanceof ApiError) {
      return NextResponse.json({ error: "Failed to analyze code from Gemini API", details: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to analyze code" }, { status: 500 })
  }
}
