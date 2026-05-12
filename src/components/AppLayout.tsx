import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
	return (
		<div className="flex min-h-screen flex-col">
			<Header />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer />
		</div>
	);
}
