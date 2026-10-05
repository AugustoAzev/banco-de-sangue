import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Estoque de Sangue' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
