import { customProvider } from 'ai'
import type ApiModel from './models'
import { GPT_4O_MINI_MODEL, GPT_4O_MODEL } from './models'

class ApiProvider {
  id: string
  name: string
  models: ApiModel[]

  constructor(id: string, name: string, models?: ApiModel[]) {
    this.id = id
    this.name = name
    this.models = models ?? []
  }
}

export default ApiProvider

const OPENROUTER_PROVIDER = new ApiProvider('openrouter', 'OpenRouter', [
  GPT_4O_MODEL,
  GPT_4O_MINI_MODEL,
])

export const ALL_PROVIDERS = [OPENROUTER_PROVIDER]

export const PROVIDERS = customProvider({
  languageModels: {
    // "gpt-4o": gateway.languageModel("gpt-4o"),
    // "gpt-4o-mini": gateway.languageModel("gpt-4o-mini"),
  },
})

