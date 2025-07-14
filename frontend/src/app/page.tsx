// src/app/page.tsx
import Link from 'next/link';

//not used as the default link opens up /portfolio

export default function HomePage() {
  return (
    <main style={{ fontFamily:"Poppins"}} className="p-6">
      <h1 className=" text-3xl font-bold mb-4">Welcome to Portfolio Tracker</h1>
      <Link className="text-blue-600 underline" href="/portfolio">
        View Portfolio
      </Link>
    </main>
  );
}
