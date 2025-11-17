'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Mobile Header */}
      <div className="navbar bg-purple-600 text-white lg:hidden sticky top-0 z-50">
        <div className="flex-1">
          <span className="text-xl font-bold">Sidang System</span>
        </div>
        <div className="flex-none">
          <div className="dropdown dropdown-end">
            <button
              id="mobile-menu-button"
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-haspopup="true"
              className="btn btn-ghost btn-circle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            {isMobileMenuOpen && (
              <ul
                id="mobile-menu"
                role="menu"
                aria-labelledby="mobile-menu-button"
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
                onBlur={(e) => {
                  // Close menu if focus leaves the menu
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <li className="menu-title text-gray-600" role="none">
                  <span>{session.user.name}</span>
                  <span className="text-xs">{session.user.role}</span>
                </li>
                {menuItems.map((item) => (
                  <li key={item.href} role="none">
                    <Link
                      href={item.href}
                      role="menuitem"
                      className={isActive(item.href) ? 'active' : ''}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="mr-2" aria-hidden="true">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li className="mt-2 border-t pt-2" role="none">
                  <button
                    role="menuitem"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-red-600"
                    aria-label="Logout from system"
                  >
                    <span aria-hidden="true">🚪</span> Logout
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block fixed left-0 top-0 h-screen w-64 bg-white shadow-xl z-40"
        aria-label="Main navigation"
      >
        <div className="p-6 bg-purple-600 text-white">
          <h1 className="text-2xl font-bold">Sidang System</h1>
          <p className="text-sm opacity-90 mt-1" aria-label={`Current role: ${session.user.role}`}>
            {session.user.role?.toUpperCase()}
          </p>
        </div>

        <div className="p-4">
          <div className="mb-6 p-3 bg-purple-50 rounded-lg" role="region" aria-label="User information">
            <p className="font-medium text-sm text-gray-700">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.email}</p>
          </div>

          <nav aria-label="Primary navigation" className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-700 hover:bg-purple-50'
                }`}
              >
                <span className="text-xl" aria-hidden="true">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-8 pt-8 border-t">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
              aria-label="Logout from system"
            >
              <span className="text-xl" aria-hidden="true">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop sidebar */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
