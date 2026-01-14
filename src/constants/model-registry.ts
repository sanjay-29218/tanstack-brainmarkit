export interface ModelCapabilities {
  vision: boolean
  reasoning: boolean
  fileUpload: boolean
  imageGen: boolean
}

export type ModelProvider =
  | 'google'
  | 'anthropic'
  | 'openai'
  | 'deepseek'
  | 'meta'
  | 'xai'
  | 'other'

export interface RegisteredModel {
  id: string
  name: string
  subtitle: string
  provider: ModelProvider
  capabilities: ModelCapabilities
  isPremium: boolean
  isPopular: boolean
  isFree: boolean
}

// Popular/Favorites models
const GEMINI_2_5_FLASH: RegisteredModel = {
  id: 'google/gemini-2.5-flash',
  name: 'Gemini',
  subtitle: '2.5 Flash',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: false,
}

export const GEMINI_2_5_FLASH_LITE: RegisteredModel = {
  id: 'google/gemini-2.5-flash-lite',
  name: 'Gemini',
  subtitle: '2.5 Flash Lite',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: false,
}

const GEMINI_2_0_FLASH_EXP: RegisteredModel = {
  id: 'google/gemini-2.0-flash-exp:free',
  name: 'Gemini',
  subtitle: '2.0 Flash Experimental (free)',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: false,
}

const CLAUDE_4_SONNET: RegisteredModel = {
  id: 'anthropic/claude-sonnet-4',
  name: 'Claude',
  subtitle: '4 Sonnet',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const CLAUDE_4_SONNET_REASONING: RegisteredModel = {
  id: 'anthropic/claude-sonnet-4:thinking',
  name: 'Claude',
  subtitle: '4 Sonnet (Reasoning)',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const GEMINI_2_5_PRO: RegisteredModel = {
  id: 'google/gemini-2.5-pro',
  name: 'Gemini',
  subtitle: '2.5 Pro',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const GPT_4_1: RegisteredModel = {
  id: 'openai/gpt-4.1',
  name: 'GPT',
  subtitle: '4.1',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const GPT_IMAGE_GEN: RegisteredModel = {
  id: 'openai/gpt-5-image',
  name: 'GPT',
  subtitle: '5 Image',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: false,
    imageGen: true,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const O4_MINI: RegisteredModel = {
  id: 'openai/o4-mini',
  name: 'o4',
  subtitle: 'mini',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const O3: RegisteredModel = {
  id: 'openai/o3',
  name: 'o3',
  subtitle: '',
  provider: 'openai',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

// Others section
const GEMINI_3_FLASH: RegisteredModel = {
  id: 'google/gemini-3-flash-preview',
  name: 'Gemini',
  subtitle: '3 Flash Preview',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GPT_4O: RegisteredModel = {
  id: 'openai/gpt-4o',
  name: 'GPT',
  subtitle: '4o',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GPT_4O_MINI: RegisteredModel = {
  id: 'openai/gpt-4o-mini',
  name: 'GPT',
  subtitle: '4o mini',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const CLAUDE_HAIKU_4_5: RegisteredModel = {
  id: 'anthropic/claude-haiku-4-5',
  name: 'Claude',
  subtitle: 'Haiku 4.5',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: true,
}

const CLAUDE_HAIKU_4_5_REASONING: RegisteredModel = {
  id: 'anthropic/claude-haiku-4-5:thinking',
  name: 'Claude',
  subtitle: 'Haiku 4.5 (Reasoning)',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const CLAUDE_OPUS_4_5: RegisteredModel = {
  id: 'anthropic/claude-opus-4-5',
  name: 'Claude',
  subtitle: 'Opus 4.5',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const CLAUDE_SONNET_4_5: RegisteredModel = {
  id: 'anthropic/claude-sonnet-4-5',
  name: 'Claude',
  subtitle: 'Sonnet 4.5',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const CLAUDE_SONNET_4_5_REASONING: RegisteredModel = {
  id: 'anthropic/claude-sonnet-4-5:thinking',
  name: 'Claude',
  subtitle: 'Sonnet 4.5 (Reasoning)',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const DEEPSEEK_V3_2: RegisteredModel = {
  id: 'deepseek/deepseek-chat-v3-0324',
  name: 'DeepSeek',
  subtitle: 'v3.2',
  provider: 'deepseek',
  capabilities: {
    vision: false,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: true,
}

const DEEPSEEK_R1: RegisteredModel = {
  id: 'deepseek/deepseek-r1',
  name: 'DeepSeek',
  subtitle: 'R1',
  provider: 'deepseek',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: true,
}

const GEMINI_3_FLASH_THINKING: RegisteredModel = {
  id: 'google/gemini-3-flash-preview:thinking',
  name: 'Gemini',
  subtitle: '3 Flash Preview (Thinking)',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GEMINI_3_PRO: RegisteredModel = {
  id: 'google/gemini-3-pro-preview',
  name: 'Gemini',
  subtitle: '3 Pro Preview',
  provider: 'google',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const LLAMA_4_SCOUT: RegisteredModel = {
  id: 'meta-llama/llama-4-scout',
  name: 'Llama',
  subtitle: '4 Scout',
  provider: 'meta',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const LLAMA_4_MAVERICK: RegisteredModel = {
  id: 'meta-llama/llama-4-maverick',
  name: 'Llama',
  subtitle: '4 Maverick',
  provider: 'meta',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

export const MISTRAL_DEVSTRAL_2_2512: RegisteredModel = {
  id: 'mistralai/devstral-2512:free',
  name: 'Mistral',
  subtitle: 'Devstral 2 2512 (free)',
  provider: 'other',
  capabilities: {
    vision: false,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: true,
}

const OLMO_3_1_32B_THINK: RegisteredModel = {
  id: 'allenai/olmo-3.1-32b-think:free',
  name: 'Olmo',
  subtitle: '3.1 32B Think (free)',
  provider: 'other',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: true,
}

const XIAOMI_MIMO_V2_FLASH: RegisteredModel = {
  id: 'xiaomi/mimo-v2-flash:free',
  name: 'Xiaomi',
  subtitle: 'MiMo-V2-Flash (free)',
  provider: 'other',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: true,
}

const GROK_4_1_FAST: RegisteredModel = {
  id: 'x-ai/grok-4.1-fast',
  name: 'Grok',
  subtitle: '4.1 Fast',
  provider: 'xai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: true,
  isFree: false,
}

const GROK_3: RegisteredModel = {
  id: 'x-ai/grok-3',
  name: 'Grok',
  subtitle: '3',
  provider: 'xai',
  capabilities: {
    vision: false,
    reasoning: false,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GROK_4: RegisteredModel = {
  id: 'x-ai/grok-4',
  name: 'Grok',
  subtitle: '4',
  provider: 'xai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GROK_3_MINI: RegisteredModel = {
  id: 'x-ai/grok-3-mini',
  name: 'Grok',
  subtitle: '3 Mini',
  provider: 'xai',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: false,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const GPT_5_PRO: RegisteredModel = {
  id: 'openai/gpt-5-pro',
  name: 'GPT',
  subtitle: '5 Pro',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const GPT_5: RegisteredModel = {
  id: 'openai/gpt-5',
  name: 'GPT',
  subtitle: '5',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: true,
  isFree: false,
}

const GPT_5_MINI: RegisteredModel = {
  id: 'openai/gpt-5-mini',
  name: 'GPT',
  subtitle: '5 mini',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const GPT_5_CHAT: RegisteredModel = {
  id: 'openai/gpt-5-chat',
  name: 'GPT',
  subtitle: '5 Chat',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const GPT_4_1_MINI: RegisteredModel = {
  id: 'openai/gpt-4.1-mini',
  name: 'GPT',
  subtitle: '4.1 mini',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const GPT_4_1_NANO: RegisteredModel = {
  id: 'openai/gpt-4.1-nano',
  name: 'GPT',
  subtitle: '4.1 nano',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: false,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const O3_PRO: RegisteredModel = {
  id: 'openai/o3-pro',
  name: 'o3',
  subtitle: 'pro',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const O3_MINI: RegisteredModel = {
  id: 'openai/o3-mini',
  name: 'o3',
  subtitle: 'mini',
  provider: 'openai',
  capabilities: {
    vision: false,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const O4_MINI_HIGH: RegisteredModel = {
  id: 'openai/o4-mini-high',
  name: 'o4',
  subtitle: 'mini high',
  provider: 'openai',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: false,
  isPopular: false,
  isFree: false,
}

const CLAUDE_OPUS_4_1: RegisteredModel = {
  id: 'anthropic/claude-opus-4.1',
  name: 'Claude',
  subtitle: 'Opus 4.1',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

const CLAUDE_3_7_SONNET: RegisteredModel = {
  id: 'anthropic/claude-3.7-sonnet',
  name: 'Claude',
  subtitle: '3.7 Sonnet',
  provider: 'anthropic',
  capabilities: {
    vision: true,
    reasoning: true,
    fileUpload: true,
    imageGen: false,
  },
  isPremium: true,
  isPopular: false,
  isFree: false,
}

export const MODEL_REGISTRY: RegisteredModel[] = [
  // Popular models
  GEMINI_2_5_FLASH,
  GEMINI_2_5_FLASH_LITE,
  GEMINI_2_0_FLASH_EXP,
  CLAUDE_4_SONNET,
  CLAUDE_4_SONNET_REASONING,
  GEMINI_2_5_PRO,
  GPT_4_1,
  GPT_IMAGE_GEN,
  O4_MINI,
  O3,
  // Others
  GEMINI_3_FLASH,
  GPT_4O,
  GPT_4O_MINI,
  CLAUDE_HAIKU_4_5,
  CLAUDE_HAIKU_4_5_REASONING,
  CLAUDE_OPUS_4_5,
  CLAUDE_SONNET_4_5,
  CLAUDE_SONNET_4_5_REASONING,
  DEEPSEEK_V3_2,
  DEEPSEEK_R1,
  GEMINI_3_FLASH_THINKING,
  GEMINI_3_PRO,
  LLAMA_4_SCOUT,
  LLAMA_4_MAVERICK,
  MISTRAL_DEVSTRAL_2_2512,
  OLMO_3_1_32B_THINK,
  XIAOMI_MIMO_V2_FLASH,
  GROK_4_1_FAST,
  GROK_3,
  GROK_4,
  GROK_3_MINI,
  GPT_5_PRO,
  GPT_5,
  GPT_5_MINI,
  GPT_5_CHAT,
  GPT_4_1_MINI,
  GPT_4_1_NANO,
  O3_PRO,
  O3_MINI,
  O4_MINI_HIGH,
  CLAUDE_OPUS_4_1,
  CLAUDE_3_7_SONNET,
]

export const POPULAR_MODELS = MODEL_REGISTRY.filter((m) => m.isPopular)
export const OTHER_MODELS = MODEL_REGISTRY.filter((m) => !m.isPopular)

export const getModelById = (id: string): RegisteredModel | undefined => {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

