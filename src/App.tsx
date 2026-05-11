import { AppLayout } from '@/components/AppLayout';
import BuildPage from '@/pages/build';
import ChampionDetailPage from '@/pages/champion-detail';
import ChampionsPage from '@/pages/champions';
import HomePage from '@/pages/home';
import ItemsPage from '@/pages/items';
import NotFoundPage from '@/pages/not-found';
import SummonersPage from '@/pages/summoners';
import { Route, Routes } from 'react-router-dom';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                <Route index element={<HomePage />} />
                <Route path="champions" element={<ChampionsPage />} />
                <Route path="champions/:championId" element={<ChampionDetailPage />} />
                <Route path="items" element={<ItemsPage />} />
                <Route path="summoners" element={<SummonersPage />} />
                <Route path="build" element={<BuildPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
