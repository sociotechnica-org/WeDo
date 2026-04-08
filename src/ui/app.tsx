import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { BoardRoute } from '@/ui/routes/board-route';
import { DashboardRoute } from '@/ui/routes/dashboard-route';
import { SingleListRoute } from '@/ui/routes/single-list-route';

const router = createBrowserRouter([
  {
    path: '/',
    element: <BoardRoute />,
    children: [
      {
        index: true,
        element: <DashboardRoute />,
      },
      {
        path: 'people/:personId',
        element: <SingleListRoute />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
