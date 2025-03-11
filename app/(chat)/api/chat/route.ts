import {
  type Message,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
// import { z } from 'zod';

import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  sanitizeResponseMessages,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

// If you prefer Edge runtime for streaming, uncomment:
// export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
    }: {
      id: string;
      messages: Array<Message>;
      selectedChatModel: string;
    } = await request.json();

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Ensure user has sent a message
    const userMessage = getMostRecentUserMessage(messages);
    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    // Check or create the chat in DB
    const chat = await getChatById({ id });
    if (!chat) {
      const title = await generateTitleFromUserMessage({ message: userMessage });
      await saveChat({ id, userId: session.user.id, title });
    } else if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Save the user message to DB
    await saveMessages({
      messages: [{ ...userMessage, createdAt: new Date(), chatId: id }],
    });

    // 1. Create the OpenRouter provider
    //    If you want to target DeepSeek R1 Zero specifically, set the baseURL.
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
      baseURL: 'https://openrouter.ai/deepseek/deepseek-r1-zero:free/api',
    });

    // 2. Return a streaming response using createDataStreamResponse
    return createDataStreamResponse({
      execute: (dataStream) => {
        // 3. Stream from the model
        const result = streamText({
          // Use the DeepSeek R1 Zero model (hard-coded example).
          // If you want to choose the model dynamically, pass `openrouter(selectedChatModel)`.
          model: openrouter('deepseek/deepseek-r1-zero:free'),

          // System prompt or instructions
          system: systemPrompt({ selectedChatModel }),

          // User + assistant messages so far
          messages,

          // Max number of "steps" for the chain-of-thought (optional)
          maxSteps: 5,

          // If you only want to enable tools for certain models
          experimental_activeTools:
            selectedChatModel === 'chat-model-reasoning'
              ? []
              : [
                  'getWeather',
                  'createDocument',
                  'updateDocument',
                  'requestSuggestions',
                ],

          // Transform tokens for chunked streaming
          experimental_transform: smoothStream({ chunking: 'word' }),

          // Generate unique IDs for new messages
          experimental_generateMessageId: generateUUID,

          // Tools your AI can call
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },

          // Callback when the AI finishes responding
          onFinish: async ({ response, reasoning }) => {
            // Save the final AI messages to DB
            if (session.user?.id) {
              try {
                const sanitized = sanitizeResponseMessages({
                  messages: response.messages,
                  reasoning,
                });
                await saveMessages({
                  messages: sanitized.map((message) => ({
                    id: message.id,
                    chatId: id,
                    role: message.role,
                    content: message.content,
                    createdAt: new Date(),
                  })),
                });
              } catch (error) {
                console.error('Failed to save chat', error);
              }
            }
          },

          // Optional telemetry
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        // 4. Pipe tokens into our dataStream
        result.consumeStream();
        result.mergeIntoDataStream(dataStream, {
          // If you want to see reasoning tokens in the stream, set to true
          sendReasoning: true,
        });
      },
      onError: () => {
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({ error }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });
    if (!chat || chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteChatById({ id });
    return new Response('Chat deleted', { status: 200 });
  } catch (error) {
    console.error('DELETE /api/chat error:', error);
    return new Response('An error occurred while processing your request', {
      status: 500,
    });
  }
}
