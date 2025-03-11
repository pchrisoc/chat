import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
// import your DB helpers, etc.

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming request JSON
    const { id, messages } = await request.json();

    // 2. Optional: check user auth if needed
    const session = await auth();
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 3. (Optional) validate or save the user’s message to DB, etc.

    // 4. Send a request to OpenRouter’s /chat/completions endpoint
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        // Insert your secret key from the environment
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // Optional: set these for ranking on openrouter.ai
        'HTTP-Referer': 'https://chat.pchrisoc.com',
        'X-Title': 'AI Chat',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-zero:free',
        messages
      })
    });

    // 5. If the response is not OK, handle the error
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('OpenRouter Error:', errorBody);
      return new Response('OpenRouter request failed', { status: 500 });
    }

    // 6. Parse JSON response from OpenRouter
    const data = await response.json();

    // 7. (Optional) save the response to DB or further transform it

    // 8. Return the data to the client
    return NextResponse.json(data);

  } catch (error) {
    console.error('POST /api/chat error:', error);
    return new Response('An error occurred', { status: 500 });
  }
}
