import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Platform configuration</p>
      </div>

      <Card className="border-slate-800 bg-slate-900">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Settings className="size-12 text-slate-700 mb-4" />
            <h2 className="text-lg font-medium text-slate-400">Coming Soon</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">
              Platform settings including default theme, email templates,
              subscription plans, and global configuration will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
