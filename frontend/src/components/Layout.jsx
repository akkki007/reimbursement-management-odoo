import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-1 bg-primary-400 z-40" aria-hidden />
      <Sidebar />
      <main className="ml-[72px] flex-1 pt-8 pb-10 px-5 lg:px-10">{children}</main>
      <footer className="ml-[72px] border-t border-gray-200/80 bg-white/60 px-5 lg:px-10 py-4 shrink-0">
        <p className="text-xs text-gray-400 text-center font-sans">
          © ReimburseFlow {new Date().getFullYear()} · Account terms of use · Privacy · Cookie policy
        </p>
      </footer>
    </div>
  );
}
