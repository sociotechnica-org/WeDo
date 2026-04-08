import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HomeRoute } from '@/ui/routes/home-route';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
