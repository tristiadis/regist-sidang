'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session || pathname === '/login' || pathname === '/unauthorized') {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const adminMenu = [
    { href: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/admin/workflow', icon: '⚙️', label: 'Workflow Builder' },
    { href: '/admin/sidang-day', icon: '🎓', label: 'Sidang Management' },
    { href: '/akademik/requirements', icon: '📋', label: 'Requirements' },
  ];

  const akademikMenu = [
    { href: '/akademik/requirements', icon: '📋', label: 'Requirements' },
    { href: '/dosen/approvals', icon: '✅', label: 'Approvals' },
  ];

  const dosenMenu = [
    { href: '/dosen/approvals', icon: '✅', label: 'Approvals' },
  ];

  const mahasiswaMenu = [
    { href: '/mahasiswa/request', icon: '📤', label: 'Ajukan Sidang' },
    { href: '/mahasiswa/tracker', icon: '📍', label: 'Status Tracking' },
  ];

  const getMenuItems = () => {
    switch (session.user.role) {
      case 'admin':
        return adminMenu;
      case 'akademik':
        return akademikMenu;
      case 'dosen':
        return dosenMenu;
      case 'mahasiswa':
        return mahasiswaMenu;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile Header */}
      <div className="navbar bg-purple-600 text-white lg:hidden sticky top-0 z-50">
        <div className="flex-1">
          <span className="text-xl font-bold">Sidang System</span>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title text-gray-600">
                <span>{session.user.name}</span>
                <span className="text-xs">{session.user.role}</span>
              </li>
              {menuItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={isActive(item.href) ? 'active' : ''}>
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t pt-2">
                <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-600">
                  🚪 Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white shadow-xl z-40">
        <div className="p-6 bg-purple-600 text-white">
          <h1 className="text-2xl font-bold">Sidang System</h1>
          <p className="text-sm opacity-90 mt-1">{session.user.role?.toUpperCase()}</p>
        </div>

        <div className="p-4">
          <div className="mb-6 p-3 bg-purple-50 rounded-lg">
            <p className="font-medium text-sm text-gray-700">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Spacer for desktop sidebar */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
