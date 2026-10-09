import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import { Toast } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Airbnb: Vacation Rentals, Cabins, Beach Houses, Unique Homes & Experiences',
  description: 'Airbnb clone — browse, search and book stays, experiences and services.',
};

const themeScript = `try{var t=localStorage.getItem('airbnb-theme');var d=t!=='light';document.documentElement.classList.add(d?'dark':'light');document.documentElement.classList.remove(d?'light':'dark');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <AppProvider>
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
