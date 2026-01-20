import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Toaster } from 'react-hot-toast';

export default function MainLayout({ children }) {
    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Toaster position="top-center" />
            <Header />
            <main className="flex-1 w-full">
                {children}
            </main>
            <Footer />
        </div>
    );
}
