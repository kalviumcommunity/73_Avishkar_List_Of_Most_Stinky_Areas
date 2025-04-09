"use client";

import {
  CheckCircle,
  XCircle,
  Camera,
  Mail,
  UserIcon,
  FileText,
  MapPin,
  Award,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import axios from "axios";

const Profile = () => {
  const {
    user,
    updateProfile,
    uploadProfilePicture,
    error: authError,
  } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [stats, setStats] = useState({
    totalAreas: 0,
    totalVotes: 0,
    highestRated: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        email: user.email || "",
        bio: user.bio || "",
      });

      if (user.profilePicture) {
        setImagePreview(user.profilePicture);
      }

      // Fetch user stats
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user's stinky areas
      const areasRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/user/me`
      );
      const areas = areasRes.data;

      // Calculate stats
      let totalVotes = 0;
      let highestRated = null;
      let highestRating = Number.NEGATIVE_INFINITY;

      areas.forEach((area) => {
        const rating = area.upvotes - area.downvotes;
        totalVotes += rating;

        if (rating > highestRating) {
          highestRating = rating;
          highestRated = area;
        }
      });

      setStats({
        totalAreas: areas.length,
        totalVotes,
        highestRated,
      });
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError("Failed to load user statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPassword({
      ...password,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (file) {
      setProfileImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfileForm = () => {
    const errors = {};

    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }

    if (formData.bio && formData.bio.length > 200) {
      errors.bio = "Bio cannot exceed 200 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!password.current) {
      errors.current = "Current password is required";
    }

    if (!password.new) {
      errors.new = "New password is required";
    } else if (password.new.length < 6) {
      errors.new = "New password must be at least 6 characters";
    }

    if (password.new !== password.confirm) {
      errors.confirm = "Passwords do not match";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);

    if (validateProfileForm()) {
      const success = await updateProfile(formData);

      if (success) {
        setSuccessMessage("Profile updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);

    if (validatePasswordForm()) {
      const success = await updateProfile({
        currentPassword: password.current,
        newPassword: password.new,
      });

      if (success) {
        setPassword({
          current: "",
          new: "",
          confirm: "",
        });
        setSuccessMessage("Password updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError(null);

    if (profileImage) {
      const success = await uploadProfilePicture(profileImage);

      if (success) {
        setProfileImage(null);
        setSuccessMessage("Profile picture updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row items-center">
            <div className="relative mb-4 sm:mb-0 sm:mr-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
                {imagePreview ? (
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-700 text-4xl font-bold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-white">
                {user?.username}
              </h1>
              <p className="text-gray-300 mt-1">{user?.email}</p>
              {user?.bio && (
                <p className="text-gray-300 mt-2 max-w-lg">{user?.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <UserIcon className="h-5 w-5 inline-block mr-2" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "password"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="h-5 w-5 inline-block mr-2" />
              Change Password
            </button>
            <button
              onClick={() => setActiveTab("picture")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "picture"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Camera className="h-5 w-5 inline-block mr-2" />
              Profile Picture
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "stats"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Award className="h-5 w-5 inline-block mr-2" />
              Statistics
            </button>
          </nav>
        </div>

        {/* Success and Error Messages */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {(error || authError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error || authError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </div>
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows="4"
                    maxLength="200"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    placeholder="Tell us a bit about yourself..."
                  ></textarea>
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {formData.bio?.length || 0}/200 characters
                  </div>
                  {formErrors.bio && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.bio}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="current"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="current"
                    name="current"
                    value={password.current}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  {formErrors.current && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.current}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="new"
                    name="new"
                    value={password.new}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  {formErrors.new && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.new}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirm"
                    name="confirm"
                    value={password.confirm}
                    onChange={handlePasswordChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  />
                  {formErrors.confirm && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.confirm}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === "picture" && (
            <form onSubmit={handleImageSubmit} className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 mb-6">
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-700 text-5xl font-bold">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="mb-4 w-full max-w-md">
                  <label
                    htmlFor="profilePicture"
                    className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Choose Image
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    name="profilePicture"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </div>

                {profileImage && (
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Upload Image
                  </button>
                )}
              </div>
            </form>
          )}

          {activeTab === "stats" && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <MapPin className="h-8 w-8 mx-auto text-red-500 mb-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Total Areas
                      </h3>
                      <p className="text-3xl font-bold text-red-600 mt-2">
                        {stats.totalAreas}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <ThumbsUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Total Votes
                      </h3>
                      <p className="text-3xl font-bold text-green-600 mt-2">
                        {stats.totalVotes}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Award className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                      <h3 className="text-xl font-semibold text-gray-900">
                        Stinky Areas
                      </h3>
                      <Link
                        to="/my-areas"
                        className="text-blue-600 hover:underline block mt-2"
                      >
                        View All My Areas
                      </Link>
                    </div>
                  </div>

                  {stats.highestRated && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        Highest Rated Area
                      </h3>
                      <div className="flex flex-col sm:flex-row items-start">
                        {stats.highestRated.images &&
                        stats.highestRated.images.length > 0 ? (
                          <img
                            src={
                              stats.highestRated.images[0] || "/placeholder.svg"
                            }
                            alt={stats.highestRated.name}
                            className="w-full sm:w-32 h-32 object-cover rounded-md mb-4 sm:mb-0 sm:mr-4"
                          />
                        ) : (
                          <div className="w-full sm:w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center mb-4 sm:mb-0 sm:mr-4">
                            <MapPin className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {stats.highestRated.name}
                          </h4>
                          <p className="text-gray-500 text-sm mb-2">
                            {stats.highestRated.location.address}
                          </p>
                          <p className="text-gray-700 mb-3">
                            {stats.highestRated.description.length > 100
                              ? `${stats.highestRated.description.substring(
                                  0,
                                  100
                                )}...`
                              : stats.highestRated.description}
                          </p>
                          <div className="flex space-x-4">
                            <span className="flex items-center text-gray-600">
                              <ThumbsUp className="h-5 w-5 mr-1 text-green-500" />
                              {stats.highestRated.upvotes}
                            </span>
                            <span className="flex items-center text-gray-600">
                              <ThumbsDown className="h-5 w-5 mr-1 text-red-500" />
                              {stats.highestRated.downvotes}
                            </span>
                            <Link
                              to={`/stinky-area/${stats.highestRated._id}`}
                              className="text-blue-600 hover:underline"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
