import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, Type, ApiError } from "@google/genai"

// Language detection based on file extension
function detectLanguage(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()

  const languageMap: Record<string, string> = {
    py: "Python",
    js: "JavaScript",
    jsx: "React/JavaScript",
    ts: "TypeScript",
    tsx: "React/TypeScript",
    java: "Java",
    c: "C",
    cpp: "C++",
    cc: "C++",
    cxx: "C++",
    cs: "C#",
    rb: "Ruby",
    go: "Go",
    php: "PHP",
    swift: "Swift",
    kt: "Kotlin",
    rs: "Rust",
    r: "R",
    scala: "Scala",
    sh: "Shell/Bash",
    bash: "Bash",
    ps1: "PowerShell",
    lua: "Lua",
    dart: "Dart",
    elm: "Elm",
    ex: "Elixir",
    exs: "Elixir",
    erl: "Erlang",
    hrl: "Erlang",
    fs: "F#",
    fsx: "F#",
    clj: "Clojure",
    cljs: "ClojureScript",
    hs: "Haskell",
    jl: "Julia",
    ml: "OCaml",
    nim: "Nim",
    pas: "Pascal",
    pl: "Perl",
    pm: "Perl",
    v: "V",
    vb: "Visual Basic",
    zig: "Zig"
  };

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
1. An overall score out of 100
2. A brief overall summary of the code quality.
3. Specific, concise, and actionable suggestions for improvement.

Evaluation criteria:
1) Descriptive names
2) Function size
3) Explicit dependencies
4) Error handling
5) Nesting levels
6) Side effects clarity
7) Magic numbers

${languageSpecificNote}

Respond with ONLY a valid JSON object in this exact format:
{
  "score": number,
  "summary": "brief overall assessment",
  "improvements": [
    {
      "category": "category name",
      "issue": "specific, concise issue description",
      "suggestion": "concise, actionable recommendation on how to fix it",
      "severity": "high|medium|low",
      "lineNumber": number | null,
      "codeSnippet": "the problematic code line/snippet" | null
    }
  ]
}

Code to analyze:
\`\`\`
${content}
\`\`\``

    const ai = new GoogleGenAI({})

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        summary: { type: Type.STRING },
        improvements: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              issue: { type: Type.STRING },
              suggestion: { type: Type.STRING },
              severity: { type: Type.STRING },
              lineNumber: { type: Type.NUMBER, nullable: true },
              codeSnippet: { type: Type.STRING, nullable: true },
            },
            required: ["category", "issue", "suggestion", "severity"],
          },
        },
      },
      required: ["score", "summary", "improvements"],
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
