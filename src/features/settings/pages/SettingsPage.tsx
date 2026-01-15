import { useThemeStore } from '@/stores/themeStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { setTheme: setStoredTheme } = useThemeStore()

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    setStoredTheme(newTheme)
  }

  return (
    <div className="space-y-6 container mx-auto px-4 py-6">Account settings and preferences
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how application looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Theme</label>
              <div className="mt-2 flex gap-2">
                {(['light', 'dark', 'system'] as const).map((themeOption) => (
                  <Badge
                    key={themeOption}
                    variant={theme === themeOption ? 'default' : 'outline'}
                    className="cursor-pointer capitalize"
                    onClick={() => handleThemeChange(themeOption)}
                  >
                    {themeOption}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Current theme: {theme}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Account settings and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Additional account settings coming soon.
          </p>
        </CardContent>
      </Card> */}
    </div>
  )
}
