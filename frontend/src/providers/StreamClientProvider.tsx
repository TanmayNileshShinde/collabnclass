import { ReactNode, useEffect, useRef, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useUser, useAuth } from "@clerk/clerk-react";

import Loader from '../components/Loader';
import { getBackendUrl } from '../lib/api';

const API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const userRef = useRef(user);
  const getTokenRef = useRef(getToken);
  userRef.current = user;
  getTokenRef.current = getToken;

  const userId = user?.id;

  useEffect(() => {
    if (!API_KEY || !isLoaded || !userId) return;

    let cancelled = false;
    const currentUser = userRef.current;

    const tokenProvider = async () => {
      try {
        const authToken = await getTokenRef.current();

        if (!authToken) {
          throw new Error("No authentication token available");
        }

        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/stream/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(`Failed to get token: ${errorMessage}`);
        }

        const data = await response.json();
        return data.token;
      } catch (error) {
        console.error("Token provider error:", error);
        throw error;
      }
    };

    const getUserDisplayName = () => {
      if (currentUser?.firstName && currentUser?.lastName) {
        return `${currentUser.firstName} ${currentUser.lastName}`;
      }
      if (currentUser?.firstName) return currentUser.firstName;
      if (currentUser?.lastName) return currentUser.lastName;
      if (currentUser?.username) return currentUser.username;
      if (currentUser?.emailAddresses?.[0]?.emailAddress) {
        return currentUser.emailAddresses[0].emailAddress.split('@')[0];
      }
      return userId;
    };

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: userId,
        name: getUserDisplayName(),
        image: currentUser?.imageUrl,
      },
      tokenProvider,
      options: {
        enableWSFallback: true,
      },
    });

    if (!cancelled) {
      setVideoClient(client);
    }

    return () => {
      cancelled = true;
      client.disconnectUser().catch((err) => {
        console.error("Error disconnecting Stream client:", err);
      });
      setVideoClient(undefined);
    };
  }, [isLoaded, userId]);

  if (!API_KEY) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 dark:bg-[#020813] bg-slate-50">
        <div className="max-w-md w-full p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-center flex flex-col items-center gap-3">
          <div className="p-3 rounded-full bg-amber-500/20 text-amber-500 font-bold text-xl">⚠️</div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Stream API Key Missing</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            <code>VITE_STREAM_API_KEY</code> is not configured. Please provide your Stream credentials to access live classroom features.
          </p>
        </div>
      </div>
    );
  }

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
