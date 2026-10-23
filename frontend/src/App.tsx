import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";

import StreamVideoProvider from "./providers/StreamClientProvider";
import { Toaster } from "./components/ui/toaster";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Home from "./pages/Home";
import Upcoming from "./pages/Upcoming";
import Previous from "./pages/Previous";
import Recordings from "./pages/Recordings";
import PersonalRoom from "./pages/PersonalRoom";
import Meeting from "./pages/Meeting";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Landing from "./pages/Landing";

import { cn } from "@/lib/utils";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isMeetingPage = location.pathname.startsWith("/meeting/");

  return (
    <>
      <SignedIn>
        <StreamVideoProvider>

          {!isMeetingPage && <Navbar />}

          <div className="flex min-h-screen">

            {!isMeetingPage && <Sidebar />}

            <main
              className={cn(
                "flex flex-1 flex-col transition-colors duration-300",
                isMeetingPage
                  ? "p-0"
                  : "px-3 sm:px-6 pb-12 pt-24 sm:pt-28 dark:bg-[#020813] bg-slate-50 dark:text-white text-slate-900 transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-200"
              )}
            >
              {children}
            </main>

          </div>

        </StreamVideoProvider>
      </SignedIn>

      <SignedOut>
        <Navigate to="/landing" replace />
      </SignedOut>
    </>
  );
}

function RootRedirect() {
  const { isSignedIn } = useAuth();
  return isSignedIn ? <Navigate to="/home" replace /> : <Navigate to="/landing" replace />;
}

function App() {
  return (
    <div className="min-h-screen dark:bg-black bg-slate-50 transition-colors duration-300">

      <BrowserRouter>

        <Toaster />

        <Routes>

          <Route path="/" element={<RootRedirect />} />

          <Route path="/landing" element={<Landing />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upcoming"
            element={
              <ProtectedRoute>
                <Upcoming />
              </ProtectedRoute>
            }
          />

          <Route
            path="/previous"
            element={
              <ProtectedRoute>
                <Previous />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recordings"
            element={
              <ProtectedRoute>
                <Recordings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/personal-room"
            element={
              <ProtectedRoute>
                <PersonalRoom />
              </ProtectedRoute>
            }
          />

          <Route
            path="/meeting/:id"
            element={
              <ProtectedRoute>
                <Meeting />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </BrowserRouter>

    </div>
  );
}

export default App;