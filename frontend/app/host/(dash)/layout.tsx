import { HostHeader } from '@/components/HostHeader';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <HostHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
