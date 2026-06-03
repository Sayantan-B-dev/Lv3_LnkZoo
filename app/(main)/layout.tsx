import Sidebar from '@/components/common/Sidebar';
import CustomCursor from '@/components/common/CustomCursor';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app">
      <CustomCursor />
      <Sidebar />
      <main id="main">
        {children}
      </main>
    </div>
  );
}
