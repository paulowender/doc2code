import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSDKWithOpenAI(
  documentation: string,
  language: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert SDK generator. Your task is to convert API documentation into a well-structured, production-ready SDK in ${language}. 
          Include proper error handling, documentation, and follow best practices for the language.
          The SDK should be easy to use and understand.`,
        },
        {
          role: 'user',
          content: `Here is the API documentation. Please generate a complete SDK in ${language} that wraps this API:
          
          ${documentation}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    return response.choices[0]?.message?.content || 'Failed to generate SDK';
  } catch (error) {
    console.error('Error generating SDK with OpenAI:', error);
    throw new Error('Failed to generate SDK with OpenAI');
  }
}
