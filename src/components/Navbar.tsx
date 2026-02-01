'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle, User, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        // Check localStorage or cookies for session
        const storedUsername = localStorage.getItem('cupid_username');
        if (storedUsername !== username) {
            setUsername(storedUsername);
        }
    }, [pathname, username]); // Re-check on route change

    if (pathname === '/login' || pathname === '/register') return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-pink-100 p-4 md:static md:top-0 md:border-b md:border-t-0 md:px-8 shadow-lg md:shadow-sm z-50">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-2">
                    <Heart className="w-8 h-8 text-pink-500 fill-pink-500" />
                    <span className="hidden md:block font-dancing text-2xl font-bold text-rose-600">Cupidon</span>
                </Link>

                <div className="flex items-center space-x-8">
                    <Link
                        href="/"
                        className={`flex flex-col items-center ${pathname === '/' ? 'text-pink-600' : 'text-gray-400 hover:text-pink-400'}`}
                    >
                        <Heart className={`w-6 h-6 ${pathname === '/' ? 'fill-pink-600' : ''}`} />
                        <span className="text-xs mt-1 font-medium">Rencontre</span>
                    </Link>

                    <Link
                        href="/chat"
                        className={`flex flex-col items-center intaller ${pathname.startsWith('/chat') ? 'text-pink-600' : 'text-gray-400 hover:text-pink-400'}`}
                    >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-xs mt-1 font-medium">Messages</span>
                    </Link>

                    {username ? (
                        <Link
                            href="/profile"
                            className={`flex flex-col items-center ${pathname === '/profile' ? 'text-pink-600' : 'text-gray-400 hover:text-pink-400'}`}
                        >
                            <User className="w-6 h-6" />
                            <span className="text-xs mt-1 font-medium">Profil</span>
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className={`flex flex-col items-center ${pathname === '/login' ? 'text-pink-600' : 'text-gray-400 hover:text-pink-400'}`}
                        >
                            <LogIn className="w-6 h-6" />
                            <span className="text-xs mt-1 font-medium">Connexion</span>
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
