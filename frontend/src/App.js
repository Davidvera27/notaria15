// src/App.js
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Layout, Menu, theme } from 'antd';
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined, // Importar icono para rentas
} from '@ant-design/icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import socketIOClient from 'socket.io-client';
import './App.css';
import Loader from './components/Loader';
import ReportForm from './components/ReportForm';
import FinishedCaseTable from './components/FinishedCaseTable';
import Contabilidad from './components/Contabilidad';
import Rentas from './components/Rentas'; // Importar componente de Rentas

const ENDPOINT = "http://127.0.0.1:5000";

const CaseForm = React.lazy(() => {
  NProgress.start();
  return import('./components/CaseForm').finally(NProgress.done);
});
const ProtocolistTable = React.lazy(() => {
  NProgress.start();
  return import('./components/ProtocolistTable').finally(NProgress.done);
});
const Home = React.lazy(() => {
  NProgress.start();
  return import('./components/Home').finally(NProgress.done);
});
const Profile = React.lazy(() => {
  NProgress.start();
  return import('./components/Profile').finally(NProgress.done);
});
const Register = React.lazy(() => {
  NProgress.start();
  return import('./components/Register').finally(NProgress.done);
});

const { Header, Content, Footer, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem('Gestión de Casos', '/cases', <PieChartOutlined />),
  getItem('Casos Finalizados', '/finished-cases', <DesktopOutlined />),
  getItem('Protocolistas', '/protocolists', <UserOutlined />),
  getItem('Informes', '/generate-report', <FileOutlined />),
  getItem('Contabilidad', 'sub1', <TeamOutlined />, [
    getItem('Rentas', '/contabilidad/rentas', <DollarOutlined />),
  ]), // Submenú con la opción de Rentas
  getItem('Registrar Usuario', '/register', <UserOutlined />),
  getItem('Perfil', '/profile', <UserOutlined />),
];

function App() {
  const { isAuthenticated, loginWithRedirect, logout, user, isLoading } = useAuth0();
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, isLoading, loginWithRedirect]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);

    socket.on('new_case', (data) => {
      toast.success(`Nuevo caso creado: ${data.radicado}`);
    });

    socket.on('update_case', (data) => {
      toast.info(`Caso actualizado: ${data.radicado}`);
    });

    return () => socket.disconnect();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    isAuthenticated && (
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Sider
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            style={{ backgroundColor: '#239426' }} // Aplicamos un verde personalizado
          >
            <div className="logo" />
            <Menu
              theme="dark"
              defaultSelectedKeys={['/']}
              mode="inline"
              items={items}
              style={{
                backgroundColor: '#239426', // Fondo verde para el menú
                color: '#fff',               // Color de texto blanco
              }}
              onClick={({ key }) => {
                window.location.pathname = key;
              }}
            />
          </Sider>
          <Layout className="site-layout">
            <Header style={{ padding: 0, background: colorBgContainer }}>
              {user && (
                <div style={{ padding: '0 16px', textAlign: 'right' }}>
                  <span>{user.name}</span>
                  <button
                    style={{ marginLeft: '16px' }}
                    onClick={() => logout({ returnTo: window.location.origin })}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </Header>
            <Content style={{ margin: '0 16px' }}>
              <Suspense fallback={<Loader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/cases" element={<CaseForm />} />
                  <Route path="/protocolists" element={<ProtocolistTable />} />
                  <Route path="/finished-cases" element={<FinishedCaseTable />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/generate-report" element={<ReportForm />} />
                  <Route path="/contabilidad" element={<Contabilidad />} />
                  <Route path="/contabilidad/rentas" element={<Rentas />} /> {/* Nueva ruta para Rentas */}
                </Routes>
              </Suspense>
            </Content>
            <Footer style={{ textAlign: 'center' }}>
              Notaría 15 ©{new Date().getFullYear()} By David Restrepo Vera
            </Footer>
          </Layout>
        </Layout>
        <ToastContainer />
      </Router>
    )
  );
}

export default App;
