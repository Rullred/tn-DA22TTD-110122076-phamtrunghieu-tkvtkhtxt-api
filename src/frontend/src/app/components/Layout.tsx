import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main
          className="flex-1 overflow-auto"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 40%, #eff6ff 100%)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
