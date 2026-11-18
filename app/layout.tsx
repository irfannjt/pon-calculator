import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PON Calculator | FTTH & PON Tools',
  description: 'Kalkulator pembagian splitter FBT dan PLC untuk jaringan FTTH.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
