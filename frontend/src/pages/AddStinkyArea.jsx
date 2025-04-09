"use client";

import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Upload, X, AlertCircle } from "lucide-react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const AddStinkyArea = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    coordinates: [0, 0], // [longitude, latitude]
    stinkLevel: 5,
    tags: "",
  });

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }

    // Check localStorage for saved coordinates
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setUserLocation(parsedLocation);

        // Initialize with user location if available
        setFormData((prev) => ({
          ...prev,
          coordinates: [parsedLocation.longitude, parsedLocation.latitude],
        }));
        setUseCurrentLocation(true);
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }
  }, [isAuthenticated, navigate]);

  // Update coordinates when using current location
  useEffect(() => {
    if (useCurrentLocation && userLocation) {
      setFormData((prev) => ({
        ...prev,
        coordinates: [userLocation.longitude, userLocation.latitude],
      }));
    }
  }, [useCurrentLocation, userLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStinkLevelChange = (e) => {
    setFormData({
      ...formData,
      stinkLevel: Number(e.target.value),
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 5 images
    if (images.length + files.length > 5) {
      setError("You can only upload up to 5 images");
      return;
    }

    setImages([...images, ...files]);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreview([...imagePreview, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...imagePreview];

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setImages(newImages);
    setImagePreview(newPreviews);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(locationData);
        localStorage.setItem("userLocation", JSON.stringify(locationData));

        if (useCurrentLocation) {
          setFormData({
            ...formData,
            coordinates: [locationData.longitude, locationData.latitude],
          });
        }

        setLocationLoading(false);
      },
      (error) => {
        setError("Unable to retrieve your location. " + error.message);
        setLocationLoading(false);
      }
    );
  };

  const toggleUseCurrentLocation = () => {
    const newValue = !useCurrentLocation;
    setUseCurrentLocation(newValue);

    if (newValue && userLocation) {
      setFormData({
        ...formData,
        coordinates: [userLocation.longitude, userLocation.latitude],
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Description is required";
    } else if (formData.description.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (formData.stinkLevel < 1 || formData.stinkLevel > 10) {
      errors.stinkLevel = "Stink level must be between 1 and 10";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("address", formData.address);

      // Format coordinates properly for the backend
      formDataToSend.append(
        "coordinates",
        JSON.stringify(formData.coordinates)
      );

      formDataToSend.append("stinkLevel", formData.stinkLevel);

      // Only append tags if they exist
      if (formData.tags.trim()) {
        formDataToSend.append("tags", formData.tags);
      }

      // Append images
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      // Log the form data for debugging
      console.log("Submitting form data:", {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        coordinates: formData.coordinates,
        stinkLevel: formData.stinkLevel,
        tags: formData.tags,
        imageCount: images.length,
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Response:", response.data);

      // Redirect to the newly created stinky area
      navigate(`/stinky-area/${response.data._id}`);
    } catch (err) {
      console.error("Error creating stinky area:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to create stinky area";
      console.error("Error details:", errorMessage);
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Report a Stinky Area
      </h1>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name of the Stinky Area *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="E.g., Garbage Dump behind Main Street"
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Describe why this area stinks, what causes the smell, etc."
          ></textarea>
          <div className="mt-1 text-xs text-gray-500 text-right">
            {formData.description.length}/500 characters
          </div>
          {formErrors.description && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.description}
            </p>
          )}
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="address"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Full address or location description"
          />
          {formErrors.address && (
            <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Location Coordinates *
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useCurrentLocation"
                checked={useCurrentLocation}
                onChange={toggleUseCurrentLocation}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label
                htmlFor="useCurrentLocation"
                className="ml-2 block text-sm text-gray-700"
              >
                Use my current location
              </label>
            </div>
          </div>

          {useCurrentLocation ? (
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={getUserLocation}
                disabled={locationLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {locationLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    {userLocation ? "Update My Location" : "Get My Location"}
                  </>
                )}
              </button>

              {userLocation && (
                <span className="text-sm text-gray-500">
                  Lat: {userLocation.latitude.toFixed(6)}, Lng:{" "}
                  {userLocation.longitude.toFixed(6)}
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="longitude"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Longitude
                </label>
                <input
                  type="number"
                  id="longitude"
                  name="longitude"
                  step="any"
                  value={formData.coordinates[0]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: [
                        Number.parseFloat(e.target.value),
                        formData.coordinates[1],
                      ],
                    })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="latitude"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Latitude
                </label>
                <input
                  type="number"
                  id="latitude"
                  name="latitude"
                  step="any"
                  value={formData.coordinates[1]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      coordinates: [
                        formData.coordinates[0],
                        Number.parseFloat(e.target.value),
                      ],
                    })
                  }
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>
          )}
          {formErrors.coordinates && (
            <p className="mt-1 text-sm text-red-600">
              {formErrors.coordinates}
            </p>
          )}
        </div>

        {/* Stink Level */}
        <div>
          <label
            htmlFor="stinkLevel"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Stink Level * ({formData.stinkLevel}/10)
          </label>
          <input
            type="range"
            id="stinkLevel"
            name="stinkLevel"
            min="1"
            max="10"
            value={formData.stinkLevel}
            onChange={handleStinkLevelChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 (Mild)</span>
            <span>5 (Moderate)</span>
            <span>10 (Unbearable)</span>
          </div>
          {formErrors.stinkLevel && (
            <p className="mt-1 text-sm text-red-600">{formErrors.stinkLevel}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags (Optional)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="E.g., garbage, sewage, chemicals (comma separated)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas
          </p>
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images (Optional, max 5)
          </label>

          {/* Image previews */}
          {imagePreview.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
              {imagePreview.map((src, index) => (
                <div key={index} className="relative">
                  <img
                    src={src || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-24 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Image upload button */}
          {images.length < 5 && (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="images"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                  >
                    <span>Upload images</span>
                    <input
                      id="images"
                      name="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 5MB each
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              "Report Stinky Area"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStinkyArea;
