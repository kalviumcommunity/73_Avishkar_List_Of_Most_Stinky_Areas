"use client";

import { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold">
              StinkyMap
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/"
              className={`text-white px-3 py-2 rounded-md ${
                isActive("/") ? "bg-red-600" : "hover:bg-red-600"
              }`}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-areas"
                  className={`text-white px-3 py-2 rounded-md ${
                    isActive("/my-areas") ? "bg-red-600" : "hover:bg-red-600"
                  }`}
                >
                  My Areas
                </Link>
                <Link
                  to="/profile"
                  className={`text-white px-3 py-2 rounded-md ${
                    isActive("/profile") ? "bg-red-600" : "hover:bg-red-600"
                  }`}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:bg-red-600 px-3 py-2 rounded-md"
                >
                  Logout
                </button>
                <div className="flex items-center ml-4">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-white px-3 py-2 rounded-md ${
                    isActive("/login") ? "bg-red-600" : "hover:bg-red-600"
                  }`}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`text-white px-3 py-2 rounded-md ${
                    isActive("/signup") ? "bg-red-600" : "hover:bg-red-600"
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="text-white p-2 rounded-md focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`text-white block px-3 py-2 rounded-md ${
                isActive("/") ? "bg-red-600" : "hover:bg-gray-600"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/my-areas"
                  className={`text-white block px-3 py-2 rounded-md ${
                    isActive("/my-areas") ? "bg-red-600" : "hover:bg-gray-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Areas
                </Link>
                <Link
                  to="/profile"
                  className={`text-white block px-3 py-2 rounded-md ${
                    isActive("/profile") ? "bg-red-600" : "hover:bg-gray-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:bg-gray-600 block w-full text-left px-3 py-2 rounded-md"
                >
                  Logout
                </button>
                <div className="flex items-center px-3 py-2">
                  <span className="text-white mr-2">
                    Hello, {user?.username}
                  </span>
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt="Profile"
                      className="h-8 w-8 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-red-800 font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-white block px-3 py-2 rounded-md ${
                    isActive("/login") ? "bg-red-600" : "hover:bg-gray-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`text-white block px-3 py-2 rounded-md ${
                    isActive("/signup") ? "bg-red-600" : "hover:bg-gray-600"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
