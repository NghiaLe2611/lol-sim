import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Outlet } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

export function AppLayout() {
    return (
        <div className="flex min-h-screen flex-col">
            <ScrollToTop />
            <Header />
            <main className="grid flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
