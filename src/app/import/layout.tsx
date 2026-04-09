import AppShell from '@/components/layout/app-shell'

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <AppShell adminOnly>{children}</AppShell>
}
