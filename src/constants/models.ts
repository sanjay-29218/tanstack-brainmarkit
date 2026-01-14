class ApiModel {
  id: string
  key: string
  name: string
  isThinking?: boolean

  constructor(id: string, key: string, name: string, isThinking?: boolean) {
    this.id = id
    this.key = key
    this.name = name
    this.isThinking = isThinking
  }
}

export const GEMINI_2_5_FLASH_MODEL = new ApiModel(
  'gemini-2.5-flash',
  'gemini-2.5-flash',
  'Gemini 2.5 Flash',
  false,
)
export const GEMINI_2_5_FLASH_LITE_MODEL = new ApiModel(
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite',
  'Gemini 2.5 Flash Lite',
  false,
)
export const GEMINI_2_5_PRO_MODEL = new ApiModel(
  'gemini-2.5-pro',
  'gemini-2.5-pro',
  'Gemini 2.5 Pro',
  true,
)
export const GPT_4O_MODEL = new ApiModel('gpt-4o', 'gpt-4o', 'GPT-4o', true)
export const GPT_4O_MINI_MODEL = new ApiModel(
  'gpt-4o-mini',
  'gpt-4o-mini',
  'GPT-4o Mini',
  false,
)

export default ApiModel

