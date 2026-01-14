import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ApiKeySetting from './api-key/ApiKeySetting'
import AccountSetting from './account-setting/AccountSetting'

export default function SettingModal() {
  return (
    <Tabs defaultValue="api" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="api">API Keys</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
      </TabsList>

      <TabsContent value="api" className="mt-4">
        <ApiKeySetting />
      </TabsContent>

      <TabsContent value="account" className="mt-4">
        <AccountSetting />
      </TabsContent>
    </Tabs>
  )
}

