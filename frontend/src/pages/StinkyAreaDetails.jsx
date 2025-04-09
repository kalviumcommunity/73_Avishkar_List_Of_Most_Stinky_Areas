"use client";

import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  ThumbsUp,
  ThumbsDown,
  Calendar,
  User,
  Tag,
  Send,
  AlertCircle,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const StinkyAreaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [stinkyArea, setStinkyArea] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [voteLoading, setVoteLoading] = useState({});

  // Fetch stinky area details
  useEffect(() => {
    const fetchStinkyArea = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}`
        );
        setStinkyArea(res.data);

        // Fetch comments
        const commentsRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}/comments`
        );
        setComments(commentsRes.data.comments);

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch stinky area details");
        setLoading(false);
        console.error(err);
      }
    };

    fetchStinkyArea();
  }, [id]);

  // Get user location from localStorage
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation && stinkyArea) {
      const location = JSON.parse(savedLocation);
      setUserLocation(location);

      // Calculate distance
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        stinkyArea.location.coordinates.coordinates[1],
        stinkyArea.location.coordinates.coordinates[0]
      );
      setDistance(dist);
    }
  }, [stinkyArea]);

  // Function to calculate distance between two coordinates in km (using Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (
      typeof lat1 !== "number" ||
      typeof lon1 !== "number" ||
      typeof lat2 !== "number" ||
      typeof lon2 !== "number"
    ) {
      return null;
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

  // Handle voting on the stinky area
  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}/vote`,
        {
          vote: voteType,
        }
      );

      setStinkyArea({
        ...stinkyArea,
        upvotes: response.data.upvotes,
        downvotes: response.data.downvotes,
        totalVotes: response.data.totalVotes,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to vote");
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    setCommentLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/stinky-areas/${id}/comments`,
        {
          content: commentText,
        }
      );

      // Add the new comment to the list
      setComments([response.data, ...comments]);
      setCommentText("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // Handle comment voting
  const handleCommentVote = async (commentId, voteType) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Set loading state for this specific comment
    setVoteLoading({ ...voteLoading, [commentId]: true });

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/comments/${commentId}/vote`,
        {
          vote: voteType,
        }
      );

      // Update the comment with new vote counts
      setComments(
        comments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                upvotes: response.data.upvotes,
                downvotes: response.data.downvotes,
              }
            : comment
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || "Failed to vote on comment");
    } finally {
      // Clear loading state
      setVoteLoading({ ...voteLoading, [commentId]: false });
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!isAuthenticated) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/comments/${commentId}`
      );

      // Remove the deleted comment from the list
      setComments(comments.filter((comment) => comment._id !== commentId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete comment");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stinkyArea) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">Stinky area not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        {/* Header with title and stink level */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {stinkyArea.name}
          </h1>
          <div className="bg-white text-red-600 border-2 border-black rounded-full w-16 h-16 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none">
              {stinkyArea.stinkLevel}
            </span>
            <span className="text-xs text-black">/10</span>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          {/* Left column - Images */}
          <div className="space-y-4">
            {stinkyArea.images && stinkyArea.images.length > 0 ? (
              <>
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={stinkyArea.images[activeImage] || "/placeholder.svg"}
                    alt={stinkyArea.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                {stinkyArea.images.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {stinkyArea.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${
                          index === activeImage ? "ring-2 ring-red-500" : ""
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`${stinkyArea.name} ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No images available</p>
              </div>
            )}

            {/* Voting section */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex space-x-6">
                <button
                  onClick={() => handleVote(1)}
                  className="flex items-center text-gray-600 hover:text-green-600 transition-colors"
                  disabled={!isAuthenticated}
                  title={isAuthenticated ? "Upvote" : "Login to vote"}
                >
                  <ThumbsUp
                    className={`h-6 w-6 mr-2 ${
                      isAuthenticated ? "cursor-pointer" : "cursor-not-allowed"
                    } ${
                      stinkyArea.upvotes > 0
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-lg">{stinkyArea.upvotes}</span>
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                  disabled={!isAuthenticated}
                  title={isAuthenticated ? "Downvote" : "Login to vote"}
                >
                  <ThumbsDown
                    className={`h-6 w-6 mr-2 ${
                      isAuthenticated ? "cursor-pointer" : "cursor-not-allowed"
                    } ${
                      stinkyArea.downvotes > 0
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="text-lg">{stinkyArea.downvotes}</span>
                </button>
              </div>
              <div className="text-gray-500">
                Total score:{" "}
                <span className="font-bold">
                  {stinkyArea.totalVotes ||
                    stinkyArea.upvotes - stinkyArea.downvotes}
                </span>
              </div>
            </div>
          </div>

          {/* Right column - Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Description
              </h2>
              <p className="text-gray-700">{stinkyArea.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Location
              </h2>
              <p className="text-gray-700 flex items-start">
                <MapPin className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>{stinkyArea.location.address}</span>
              </p>
              {distance && (
                <p className="text-gray-500 mt-2">
                  <span className="font-medium">{distance.toFixed(1)} km</span>{" "}
                  from your location
                </p>
              )}
            </div>

            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">Reported by: </span>
              <span className="font-medium ml-1">
                {stinkyArea.reporter?.username || "Anonymous"}
              </span>
            </div>

            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-700">Reported on: </span>
              <span className="font-medium ml-1">
                {formatDate(stinkyArea.createdAt)}
              </span>
            </div>

            {stinkyArea.tags && stinkyArea.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stinkyArea.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit button (only for the reporter) */}
            {isAuthenticated &&
              user &&
              stinkyArea.reporter &&
              stinkyArea.reporter._id === user._id && (
                <div className="mt-4">
                  <button
                    onClick={() =>
                      navigate(`/edit-stinky-area/${stinkyArea._id}`)
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Edit This Stinky Area
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Comments ({comments.length})
          </h2>
        </div>

        {/* Comment form */}
        {isAuthenticated ? (
          <form
            onSubmit={handleCommentSubmit}
            className="p-6 border-b border-gray-200"
          >
            <div className="flex items-start space-x-4">
              <div className="min-w-0 flex-1">
                <div className="relative">
                  <textarea
                    id="comment"
                    name="comment"
                    rows="3"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  ></textarea>
                </div>
              </div>
              <button
                type="submit"
                disabled={commentLoading || !commentText.trim()}
                className="inline-flex items-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {commentLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 border-b border-gray-200 text-center">
            <p className="text-gray-600">
              Please{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                log in
              </a>{" "}
              to leave a comment.
            </p>
          </div>
        )}

        {/* Comments list */}
        <div className="divide-y divide-gray-200">
          {comments.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                No comments yet. Be the first to comment!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="p-6">
                <div className="flex justify-between">
                  <div className="flex items-center mb-2">
                    {comment.author.profilePicture ? (
                      <img
                        src={
                          comment.author.profilePicture || "/placeholder.svg"
                        }
                        alt={comment.author.username}
                        className="h-8 w-8 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold mr-2">
                        {comment.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium">
                      {comment.author.username}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Delete button (only for comment author) */}
                  {isAuthenticated &&
                    user &&
                    comment.author._id === user._id && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete comment"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                </div>

                <p className="text-gray-700 mb-3">{comment.content}</p>

                {/* Comment voting */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleCommentVote(comment._id, 1)}
                    className="flex items-center text-gray-500 hover:text-green-600 transition-colors"
                    disabled={!isAuthenticated || voteLoading[comment._id]}
                  >
                    {voteLoading[comment._id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600 mr-1"></div>
                    ) : (
                      <ThumbsUp className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm">{comment.upvotes}</span>
                  </button>
                  <button
                    onClick={() => handleCommentVote(comment._id, -1)}
                    className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
                    disabled={!isAuthenticated || voteLoading[comment._id]}
                  >
                    {voteLoading[comment._id] ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-600 mr-1"></div>
                    ) : (
                      <ThumbsDown className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-sm">{comment.downvotes}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StinkyAreaDetails;
