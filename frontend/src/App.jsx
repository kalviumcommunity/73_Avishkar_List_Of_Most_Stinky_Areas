import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import AddStinkyArea from "./pages/AddStinkyArea";
import EditStinkyArea from "./pages/EditStinkyArea";
import StinkyAreaDetails from "./pages/StinkyAreaDetails";
import MyAreas from "./pages/MyAreas";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-stinky-area"
                element={
                  <ProtectedRoute>
                    <AddStinkyArea />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-stinky-area/:id"
                element={
                  <ProtectedRoute>
                    <EditStinkyArea />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-areas"
                element={
                  <ProtectedRoute>
                    <MyAreas />
                  </ProtectedRoute>
                }
              />
              <Route path="/stinky-area/:id" element={<StinkyAreaDetails />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
