import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json({ message: "Prompt is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ message: "Server configuration error: GROQ_API_KEY missing" }, { status: 500 });
        }

        const groq = new Groq({ apiKey });

        const systemInstruction = `
        You are an expert survey creator. 
        Create a survey based on the user's prompt. 
        Return ONLY a valid JSON object. Do not wrap it in markdown code blocks. 
        The JSON must follow this structure:
        {
            "title": "String",
            "description": "String",
            "questions": [
                {
                    "text": "String",
                    "type": "text | long_text | number | multiple_choice | checkbox | date",
                    "required": boolean,
                    "options": ["Option 1", "Option 2"] (Only for multiple_choice/checkbox, otherwise empty array)
                }
            ]
        }
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Create a survey for: ${prompt}` }
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            reasoning_effort: "medium",
            stream: true,
            stop: null,
            response_format: { type: "json_object" }
        });

        let generatedText = "";
        for await (const chunk of completion) {
            generatedText += chunk.choices[0]?.delta?.content || "";
        }

        // Cleanup potential markdown formatting
        const jsonString = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
        const surveyData = JSON.parse(jsonString);

        return NextResponse.json(surveyData);

    } catch (error) {
        console.error("AI Generation Error:", error);

        if (error instanceof Groq.APIError) {
            return NextResponse.json({
                message: error.message || "Groq API Error",
                code: error.code
            }, { status: error.status || 500 });
        }

        return NextResponse.json({
            message: "Failed to generate survey",
            details: error.message
        });
    }
}
