import axios from 'axios';

export async function generateSDKWithGroq(
  documentation: string,
  language: string
): Promise<string> {
  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-70b-8192',
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
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
      }
    );

    return response.data.choices[0]?.message?.content || 'Failed to generate SDK';
  } catch (error) {
    console.error('Error generating SDK with Groq:', error);
    throw new Error('Failed to generate SDK with Groq');
  }
}
