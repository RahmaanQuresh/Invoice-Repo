import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function generateAIReminder(
  sampleText: string,
  templateMessage: string,
  tone: "casual" | "formal" | "informal" | "legal"
): Promise<string> {
  // If no API key configured, return template
  if (!process.env.OPENAI_API_KEY) {
    return templateMessage;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a writing assistant. Rewrite the given reminder message in the user's voice.
          - Tone level: ${tone}
          - Match the user's writing style, vocabulary, and sentence structure from their sample.
          - Keep all key information (invoice number, amount, dates, urgency).
          - Do not add placeholders the user didn't provide.
          - Return ONLY the rewritten message, no explanations.`,
        },
        {
          role: "user",
          content: `Here is a sample of how the user writes:\n\n${sampleText}\n\n---\n\nHere is the reminder to rewrite:\n\n${templateMessage}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || templateMessage;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return templateMessage;
  }
}
