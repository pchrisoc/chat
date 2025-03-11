import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

// Create an instance of OpenRouter using your API key.
const openrouterInstance = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

// For test environment, use your test models.
// In production, use OpenRouter for language models.
// Note: The image models section is removed because OpenRouter does not support them by default.
export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model-small': chatModel,
        'chat-model-large': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model-small': openrouterInstance('gpt-4o-mini'),
        'chat-model-large': openrouterInstance('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openrouterInstance('gpt-4o-reasoning'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openrouterInstance('gpt-4-turbo'),
        'artifact-model': openrouterInstance('gpt-4o-mini'),
      },
    });
