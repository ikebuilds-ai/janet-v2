import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Janet — Your Gold Coast Holiday Agent 🏖️',
  description: "Don't stress, darl — Janet's on it. Build a perfect Gold Coast family holiday package within your budget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh text-gray-800">
        {children}
        <footer className="text-center py-6 text-xs text-gray-400">
          Built on the Gold Coast by{' '}
          <a href="https://erosium.com.au" target="_blank" rel="noopener" className="text-ocean-600 hover:underline">
            Erosium
          </a>
          {' · '}Janet knows what she's doing · Not official — always verify prices
        </footer>
      </body>
    </html>
  );
}
