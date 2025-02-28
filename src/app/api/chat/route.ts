import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  const { message } = await request.json();

  try {
    const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      throw new Error('Cloudflare credentials are missing');
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`;

    const response = await axios.post(
      url,
      {
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json({ response: response.data.result.response });
  } catch (error) {
    console.error('Error calling Cloudflare Workers AI:', error);
    return NextResponse.json(
      { message: 'Failed to get a response. Please try again.' },
      { status: 500 }
    );
  }
}