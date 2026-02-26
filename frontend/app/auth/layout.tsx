import AuthPillar from '@/components/AuthPillar';
import { Heart } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative ">
      <AuthPillar />

      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 z-10"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-600 rounded-lg flex items-center justify-center">
          <Heart className="w-4 h-4 text-white fill-white" />
        </div>
        <span className="text-xl font-bold text-white">Matcha</span>
      </Link>

      <div className="relative z-10 w-full max-w-6xl">
        {children}
      </div>
    </div>
  );
}
