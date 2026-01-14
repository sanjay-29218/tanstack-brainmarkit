import { observable, makeObservable, action } from 'mobx'
import { ALL_PROVIDERS } from '@/constants/api-providers'

export type ApiKey = {
  id: string | null
  modelProviderId: string
  key: string | null
}

export class ApiKeySettingModel {
  apiKeys: ApiKey[] = []

  constructor() {
    makeObservable(this, {
      apiKeys: observable,
      addProvider: action,
      removeProvider: action,
      updateApiKeyValue: action,
      getApiKey: action,
      init: action,
    })
  }

  init(apiKeys?: ApiKey[]) {
    if (!apiKeys) {
      this.apiKeys = []
      return
    }

    apiKeys.forEach((key) => {
      const provider = ALL_PROVIDERS.find((p) => p.id === key.modelProviderId)
      if (!provider) return
      const existingKey = this.apiKeys.find((k) => k.modelProviderId === key.modelProviderId)
      if (existingKey) {
        return
      }
      this.apiKeys.push({
        id: key.id,
        modelProviderId: key.modelProviderId,
        key: key.key,
      })
    })
  }

  addProvider(providerId: string) {
    this.apiKeys.push({
      id: null,
      modelProviderId: providerId,
      key: null,
    })
  }

  removeProvider(providerId: string) {
    this.apiKeys = this.apiKeys.filter((k) => k.modelProviderId !== providerId)
  }

  updateApiKeyValue(providerId: string, key: string) {
    const apiKey = this.apiKeys.find((k) => k.modelProviderId === providerId)
    if (!apiKey) return
    apiKey.key = key
  }

  getApiKey(providerId: string) {
    return this.apiKeys.find((k) => k.modelProviderId === providerId)?.key
  }
}

