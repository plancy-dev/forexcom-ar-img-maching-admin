import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-sm h-[calc(100vh-4rem)]">
      <nav className="mt-5 px-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
              isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          대시보드
        </NavLink>
        <NavLink
          to="/images"
          className={({ isActive }) =>
            `group flex items-center px-2 py-2 text-base font-medium rounded-md ${
              isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          이미지 관리
        </NavLink>
      </nav>
    </div>
  );
} 