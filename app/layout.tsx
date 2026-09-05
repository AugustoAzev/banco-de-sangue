import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../src/contexts/ToastContext';

export const metadata: Metadata = {
  title: 'Banco de Sangue',
  icons: {
    icon: '/banco-de-sangue-logo.png',
    shortcut: '/banco-de-sangue-logo.png',
    apple: '/banco-de-sangue-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
