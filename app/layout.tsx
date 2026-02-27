import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Deckible Support Copilot',
  description: 'Zendesk triage and draft assistant',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
