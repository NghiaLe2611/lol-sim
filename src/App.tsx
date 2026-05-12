import { appRoutes } from '@/routes';
import { useRoutes, type RouteObject } from 'react-router-dom';

export default function App() {
    const elements = useRoutes(appRoutes as unknown as RouteObject[]) || null;
    return elements;
}
