// src/app/layout.tsx

import "../styles/globals.css"
export const metadata = {
  title: 'Stock Portfolio Tracker',
  description: 'Track your stocks in real-time with CMP, P/E, and more.',
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}