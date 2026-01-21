'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { BiLogOut, BiUser, BiHome, BiKey } from 'react-icons/bi';
import toast from 'react-hot-toast';

export default function Header() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                toast.success('Logged out successfully');
                router.push('/login');
                router.refresh(); // Refresh to update middleware/server state
            } else {
                toast.error('Failed to log out');
            }
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('An error occurred');
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">
                            N
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 hidden sm:block">
                            NirbachonHub
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-1">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <BiHome size={16} /> Dashboard
                            </Button>
                        </Link>
                        <Link href="/create-survey">
                            <Button variant="ghost" size="sm">
                                Create Survey
                            </Button>
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 mr-2 px-3 py-1 bg-slate-50 rounded-full border">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                            <BiUser size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-600">Admin</span>
                    </div>
                    <Link href="/change-password">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <BiKey size={18} />
                            <span className="hidden sm:inline">Change Password</span>
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2">
                        <BiLogOut size={18} />
                        <span className="hidden sm:inline">Logout</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
