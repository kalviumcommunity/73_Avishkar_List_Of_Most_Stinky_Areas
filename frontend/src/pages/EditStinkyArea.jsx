"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, AlertCircle, ArrowLeft } from "lucide-react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const EditStinkyArea = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    coordinates: [0, 0], // [longitude, latitude]
    stinkLevel: 5,
    tags: "",
  });

  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newImagePreview, setNewImagePreview] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Check if user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch stinky area data
  useEffect(() => {
    const fetchStinkyArea = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}`
        );
        const area = res.data;

        // Check if user is the reporter
        if (!user || area.reporter._id !== user._id) {
          setError("You are not authorized to edit this stinky area");
          setLoading(false);
          return;
        }

        setFormData({
          name: area.name,
          description: area.description,
          address: area.location.address,
          coordinates: area.location.coordinates.coordinates,
          stinkLevel: area.stinkLevel,
          tags: area.tags ? area.tags.join(", ") : "",
        });

        if (area.images && area.images.length > 0) {
          setExistingImages(area.images);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching stinky area:", err);
        setError(
          "Failed to fetch stinky area details: " +
            (err.response?.data?.message || err.message)
        );
        setLoading(false);
      }
    };

    // Check localStorage for saved coordinates
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (e) {
        console.error("Error parsing saved location:", e);
      }
    }

    if (id && user) {
      fetchStinkyArea();
    }
  }, [id, navigate, user]);

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

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Limit to 5 images total
    if (
      existingImages.length -
        imagesToRemove.length +
        newImages.length +
        files.length >
      5
    ) {
      setError("You can only have up to 5 images total");
      return;
    }

    setNewImages([...newImages, ...files]);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreview([...newImagePreview, ...newPreviews]);
  };

  const removeExistingImage = (index) => {
    setImagesToRemove([...imagesToRemove, existingImages[index]]);
  };

  const removeNewImage = (index) => {
    const newImagesArray = [...newImages];
    const newPreviewsArray = [...newImagePreview];

    newImagesArray.splice(index, 1);
    newPreviewsArray.splice(index, 1);

    setNewImages(newImagesArray);
    setNewImagePreview(newPreviewsArray);
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

    setSubmitLoading(true);
    setError(null);

    try {
      // Create a regular object instead of FormData
      const updateData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        coordinates: formData.coordinates,
        stinkLevel: formData.stinkLevel,
        tags: formData.tags,
      };

      console.log("Submitting update with data:", updateData);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}`,
        updateData
      );

      console.log("Update response:", response.data);

      // Redirect to the stinky area details
      navigate(`/stinky-area/${response.data._id}`);
    } catch (err) {
      console.error("Error updating stinky area:", err);
      setError(
        "Failed to update stinky area: " +
          (err.response?.data?.message || err.message)
      );
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error && error.includes("not authorized")) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Stinky Area</h1>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <p className="text-sm text-red-700 mt-2">
                You can only edit stinky areas that you have reported.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => navigate("/my-areas")}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Go to My Areas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Stinky Area</h1>
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitLoading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {submitLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              "Update Stinky Area"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStinkyArea;
