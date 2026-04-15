import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.scss';
import RootLayout from './layouts/RootLayout';
import MainLayout from './layouts/MainLayout';
import FarmsPage from './pages/FarmsPage';
import BuildingPage from './pages/BuildingPage';
import PlotPage from './pages/PlotPage';
import PlantPage from './pages/PlantPage';
import DataPages from './pages/DataPages';
import { ConfigProvider } from 'antd';
import '@fontsource/plus-jakarta-sans';
import 'react-material-symbols/dist/outlined.css';
import { randomiseData } from './mock-data-generation/dataRandomiser';
import ImagePage from './pages/ImagePage';
import AdministrationPage from './pages/AdministrationPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ImageChatBoxPage from './pages/ImageChatBoxPage';
import CapturePage from './pages/CapturePage';
import ChatbotComponent from './components/ChatbotComponent';
import AddRuleForm from './components/AddRuleFrom';
import ChatBoxTest from './pages/ChatBoxTest';
import RobotControlPage from './pages/RobotArmControlPage';
import TurtlebotPage from './pages/TurtlebotPage';
import TestTurtleBot from './pages/TestTurtleBot';
import MultiRobotPage from './pages/MultiRobotPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        path: '',
        element: <MainLayout />,
        children: [
          {
            path: '',
            element: <FarmsPage />,
          },
          {
            path: 'building/:buildingId',
            element: <BuildingPage />,
          },
          {
            path: 'plot/:plotId',
            element: <PlotPage />,
          },
          {
            path: 'plant/:plantId',
            element: <PlantPage />,
          },
          {
            path: '/iot',
            element: <DataPages />,
          },
          {
            path: '/image',
            element: <ImagePage />,
          },
          {
            path: '/admin-login',
            element: <AdminLoginPage />,
          },
          {
            path: '/admin',
            element: <AdministrationPage />,
          },
          {
            path: '/image-chat-box',
            element: <ImageChatBoxPage />,
          },
          {
            path: '/chatbox-test',
            element: <ChatBoxTest />,
          },
          {
            path: '/add-rule',
            element: <AddRuleForm />,
          },
          {
            path: '/robot-control',
            element: <RobotControlPage />,
          },
          {
            path: '/turtlebot',
            element: <TurtlebotPage />,
          },
          {
            path: '/multi-robot',
            element: <MultiRobotPage />,
          },
          // {
          //   path: '/test-turtlebot',
          //   element: <TestTurtleBot />,
          // },
          // {
          //   path: '/capture',
          //   element: <CapturePage />,  sample for add path and element
          // },
        ],
      },
    ],
  },
]);

randomiseData();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#6B9080',
        colorTextBase: '#040303',
        fontFamily:
          // eslint-disable-next-line quotes
          "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",

        colorBgLayout: '#fff',
      },
    }}
  >
    <RouterProvider router={router} />
  </ConfigProvider>,
);
