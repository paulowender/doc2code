import axios from 'axios';

export async function generateSDKWithOpenRouter(
  documentation: string,
  language: string
): Promise<string> {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-opus',
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
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'doc2code',
        },
      }
    );

    return response.data.choices[0]?.message?.content || 'Failed to generate SDK';
  } catch (error) {
    console.error('Error generating SDK with OpenRouter:', error);
    throw new Error('Failed to generate SDK with OpenRouter');
  }
}
