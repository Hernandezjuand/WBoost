import * as openai from './openai';
import * as anthropic from './anthropic';
import * as gemini from './gemini';

export const AI_PROVIDERS = {
  openai,
  anthropic,
  gemini
};

export const getAIProvider = (provider) => {
  return AI_PROVIDERS[provider] || AI_PROVIDERS.openai;
}; 