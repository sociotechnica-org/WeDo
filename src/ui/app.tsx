import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { BoardRoute } from '@/ui/routes/board-route';
import { DashboardRoute } from '@/ui/routes/dashboard-route';
import { SettingsRoute } from '@/ui/routes/settings-route';
import { SingleListRoute } from '@/ui/routes/single-list-route';
import { WatercolorPrototypeRoute } from '@/ui/routes/watercolor-prototype-route';

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
      {
        path: 'settings',
        element: <SettingsRoute />,
      },
      {
        path: 'prototype/watercolor',
        element: <WatercolorPrototypeRoute />,
      },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
