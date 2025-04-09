"use client";

import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  AlertCircle,
  Plus,
} from "lucide-react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const MyAreas = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [myAreas, setMyAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's stinky areas
  useEffect(() => {
    const fetchMyAreas = async () => {
      if (!isAuthenticated) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stinky-areas/user/me`
        );
        setMyAreas(res.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch your stinky areas");
        setLoading(false);
        console.error(err);
      }
    };

    fetchMyAreas();
  }, [isAuthenticated]);

  // Handle delete stinky area
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this stinky area? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleteLoading(id);

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}`
      );
      setMyAreas(myAreas.filter((area) => area._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete stinky area");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Stinky Areas</h1>
        <Link
          to="/add-stinky-area"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-red-600 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Area
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {myAreas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            You haven't reported any stinky areas yet.
          </p>
          <Link
            to="/add-stinky-area"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-red-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Your First Stinky Area
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myAreas.map((area) => (
            <div
              key={area._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="p-6 flex flex-col flex-grow relative">
                {/* Stink Level Badge */}
                <div className="absolute top-4 right-4 bg-white text-red-600 border-2 border-black rounded-full w-12 h-12 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold leading-none">
                    {area.stinkLevel}
                  </span>
                  <span className="text-xs text-black">/10</span>
                </div>

                {/* Title & Address */}
                <h3 className="text-xl font-semibold mb-2 pr-14">
                  {area.name}
                </h3>
                <p className="text-gray-500 text-sm mb-3 flex items-start">
                  <MapPin className="h-4 w-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" />
                  {area.location.address}
                </p>

                {/* Description */}
                <p className="text-gray-700 mb-4 flex-grow">
                  {area.description.length > 100
                    ? `${area.description.substring(0, 100)}...`
                    : area.description}
                </p>

                {/* Image Preview */}
                {area.images && area.images.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={area.images[0] || "/placeholder.svg"}
                      alt={area.name}
                      className="h-32 w-full object-cover rounded-md"
                    />
                  </div>
                )}

                {/* Footer Section - Stuck at Bottom */}
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex space-x-4">
                    <span className="flex items-center text-gray-600">
                      <ThumbsUp
                        className={`h-5 w-5 mr-1 ${
                          area.upvotes > 0 ? "text-green-500" : "text-gray-400"
                        }`}
                      />
                      {area.upvotes}
                    </span>
                    <span className="flex items-center text-gray-600">
                      <ThumbsDown
                        className={`h-5 w-5 mr-1 ${
                          area.downvotes > 0 ? "text-red-500" : "text-gray-400"
                        }`}
                      />
                      {area.downvotes}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/edit-stinky-area/${area._id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(area._id)}
                      disabled={deleteLoading === area._id}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      {deleteLoading === area._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                    <Link
                      to={`/stinky-area/${area._id}`}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <span className="text-sm font-medium">View</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAreas;
