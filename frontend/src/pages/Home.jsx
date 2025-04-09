"use client";

import {
  XCircle,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Clock,
  Plus,
} from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const Home = () => {
  const [stinkyAreas, setStinkyAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [activeTab, setActiveTab] = useState("nearby");
  const [nearbyAreas, setNearbyAreas] = useState([]);
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check if user has stored location
  useEffect(() => {
    // Check localStorage for saved coordinates
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }
  }, []);

  // Fetch stinky areas
  useEffect(() => {
    const fetchStinkyAreas = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stinky-areas`
        );
        setStinkyAreas(res.data.stinkyAreas);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch stinky areas");
        setLoading(false);
        console.error(err);
      }
    };

    fetchStinkyAreas();
  }, []);

  // Calculate nearby areas when user location or stinky areas change
  useEffect(() => {
    if (userLocation && stinkyAreas.length > 0) {
      console.log("Calculating nearby areas with user location:", userLocation);
      console.log("Total stinky areas:", stinkyAreas.length);

      // Filter areas within 25km radius
      const nearby = stinkyAreas.filter((area) => {
        // Ensure coordinates exist and are in the expected format
        if (
          !area.location?.coordinates?.coordinates ||
          !Array.isArray(area.location.coordinates.coordinates) ||
          area.location.coordinates.coordinates.length !== 2
        ) {
          console.warn("Invalid coordinates for area:", area._id, area.name);
          return false;
        }

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          area.location.coordinates.coordinates[1], // latitude
          area.location.coordinates.coordinates[0] // longitude
        );

        console.log(`Area ${area.name} is ${distance.toFixed(2)}km away`);
        return distance <= 25;
      });

      console.log("Found nearby areas:", nearby.length);
      setNearbyAreas(nearby);
    } else if (!userLocation) {
      console.log("No user location available");
    } else if (stinkyAreas.length === 0) {
      console.log("No stinky areas available");
    }
  }, [userLocation, stinkyAreas]);

  // Function to calculate distance between two coordinates in km (using Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      typeof lat1 !== "number" ||
      typeof lon1 !== "number" ||
      typeof lat2 !== "number" ||
      typeof lon2 !== "number"
    ) {
      console.warn("Invalid coordinates for distance calculation:", {
        lat1,
        lon1,
        lat2,
        lon2,
      });
      return Number.POSITIVE_INFINITY; // Return a large value to exclude this area
    }

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Get user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log("Got user location:", locationData);
        setUserLocation(locationData);
        localStorage.setItem("userLocation", JSON.stringify(locationData));
        setLocationLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Unable to retrieve your location. " + error.message);
        setLocationLoading(false);
      }
    );
  };

  // Handle voting on a stinky area
  const handleVote = async (areaId, voteType) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/${areaId}/vote`,
        {
          vote: voteType,
        }
      );

      // Update the stinky areas with the new vote counts
      setStinkyAreas((prevAreas) =>
        prevAreas.map((area) =>
          area._id === areaId
            ? {
                ...area,
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
                totalVotes: response.data.totalVotes,
              }
            : area
        )
      );
    } catch (err) {
      console.error("Error voting:", err);
      setError(err.response?.data?.message || "Failed to vote");
    }
  };

  // Determine which areas to display based on active tab
  const displayedAreas =
    activeTab === "nearby" && userLocation ? nearbyAreas : stinkyAreas;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Location Request Banner (only show if location not shared) */}
      {!userLocation && (
        <div className="bg-gray-100 border-b border-gray-200 p-4 mb-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <MapPin className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-gray-700">
              Share your location to see stinky areas near you
            </p>
          </div>
          <button
            onClick={getUserLocation}
            disabled={locationLoading}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          >
            {locationLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Getting Location...
              </>
            ) : (
              "Share Location"
            )}
          </button>
        </div>
      )}

      {/* Location Error Message */}
      {locationError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add Stinky Area Button */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex justify-center">
        <Link
          to="/add-stinky-area"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-800 hover:bg-red-600 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Report a Stinky Area
        </Link>
      </div>

      {/* Mini Navbar for Toggling */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("nearby")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "nearby"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center">
              <MapPin className="h-5 w-5 mr-2" />
              Nearby Areas{" "}
              {userLocation ? `(${nearbyAreas.length})` : "(Location Required)"}
            </div>
          </button>
          <button
            onClick={() => setActiveTab("latest")}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === "latest"
                ? "text-red-600 border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center">
              <Clock className="h-5 w-5 mr-2" />
              Latest Areas ({stinkyAreas.length})
            </div>
          </button>
        </div>
      </div>

      {/* Conditional Content Based on Tab and Location */}
      <div className="mb-8">
        {activeTab === "nearby" && !userLocation ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Location Required</h3>
            <p className="text-gray-600 mb-4">
              Please share your location to see stinky areas near you.
            </p>
            <button
              onClick={getUserLocation}
              disabled={locationLoading}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              {locationLoading ? "Getting Location..." : "Share Location"}
            </button>
          </div>
        ) : displayedAreas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600">
              {activeTab === "nearby"
                ? "No stinky areas reported near you yet. Be the first to report one!"
                : "No stinky areas reported yet. Be the first to report one!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedAreas.map((area) => (
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
                  <p className="text-gray-500 text-sm mb-3">
                    {area.location.address}
                  </p>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 flex-grow">
                    {area.description.length > 100
                      ? `${area.description.substring(0, 100)}...`
                      : area.description}
                  </p>

                  {/* Distance (if in nearby tab and location available) */}
                  {activeTab === "nearby" && userLocation && (
                    <p className="text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        area.location.coordinates.coordinates[1],
                        area.location.coordinates.coordinates[0]
                      ).toFixed(1)}{" "}
                      km away
                    </p>
                  )}

                  {/* Footer Section - Stuck at Bottom */}
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-200">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleVote(area._id, 1)}
                        className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
                        disabled={!isAuthenticated}
                        title={isAuthenticated ? "Upvote" : "Login to vote"}
                      >
                        <ThumbsUp
                          className={`h-5 w-5 mr-1 ${
                            isAuthenticated
                              ? "cursor-pointer"
                              : "cursor-not-allowed"
                          } ${
                            area.upvotes > 0
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                        {area.upvotes}
                      </button>
                      <button
                        onClick={() => handleVote(area._id, -1)}
                        className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                        disabled={!isAuthenticated}
                        title={isAuthenticated ? "Downvote" : "Login to vote"}
                      >
                        <ThumbsDown
                          className={`h-5 w-5 mr-1 ${
                            isAuthenticated
                              ? "cursor-pointer"
                              : "cursor-not-allowed"
                          } ${
                            area.downvotes > 0
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                        {area.downvotes}
                      </button>
                    </div>
                    <Link
                      to={`/stinky-area/${area._id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
