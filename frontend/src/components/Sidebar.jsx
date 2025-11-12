// src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-100 p-4 fixed top-16 left-0 h-full overflow-y-auto">
      <ul className="space-y-4">
        <li className="mt-4">
          <Link to="/dashboard" className="font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            🏠 Dashboard
          </Link>
        </li>
        <li>
          <Link to="/orders" className="text-gray-700 hover:text-gray-900 transition-colors">
            📦 Orders
          </Link>
        </li>
        <li>
          <Link to="/customers" className="text-gray-700 hover:text-gray-900 transition-colors">
            👥 Customers
          </Link>
        </li>
        <li>
          <Link to="/dashboard/analytics" className="text-gray-700 hover:text-gray-900 transition-colors">
            📊 Analytics
          </Link>
        </li>
        <li>
          <Link to="/dashboard/inventory" className="text-gray-700 hover:text-gray-900 transition-colors">
            📦 Inventory
          </Link>
        </li>
        <li>
          <Link to="/dashboard/discounts" className="text-gray-700 hover:text-gray-900 transition-colors">
            💸 Discounts
          </Link>
        </li>
        <li>
          <Link to="/dashboard/reviews" className="text-gray-700 hover:text-gray-900 transition-colors">
            ⭐ Reviews
          </Link>
        </li>
        <li>
          <Link to="/dashboard/notifications" className="text-gray-700 hover:text-gray-900 transition-colors">
            🔔 Notifications
          </Link>
        </li>
        <li>
          <Link to="/dashboard/integrations" className="text-gray-700 hover:text-gray-900 transition-colors">
            🔗 Integrations
          </Link>
        </li>
        <li>
          <Link to="/site-builder" className="text-gray-700 hover:text-gray-900 transition-colors">
            🧱 Site Builder
          </Link>
        </li>
        <li>
          <Link to="/dashboard/help" className="text-gray-700 hover:text-gray-900 transition-colors">
            🆘 Help Center
          </Link>
        </li>
        <li>
          <Link to="/logout" className="text-gray-700 hover:text-gray-900 transition-colors">
            🚪 Logout
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
