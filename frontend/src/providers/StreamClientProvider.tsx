import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useUser, useAuth } from "@clerk/clerk-react";

import Loader from '../components/Loader';
import { getBackendUrl } from '../lib/api';

const API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

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

  useEffect(() => {
    if (!isLoaded || !user) return;

    const tokenProvider = async () => {
      try {
        const authToken = await getToken();

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

    // display name
    const getUserDisplayName = () => {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName} ${user.lastName}`;
      }
      if (user?.firstName) return user.firstName;
      if (user?.lastName) return user.lastName;
      if (user?.username) return user.username;
      if (user?.emailAddresses?.[0]?.emailAddress) {
        return user.emailAddresses[0].emailAddress.split('@')[0];
      }
      return user?.id || 'User';
    };

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user?.id,
        name: getUserDisplayName(),
        image: user?.imageUrl,
      },
      tokenProvider,
      options: {
        enableWSFallback: true,
      },
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser().catch((err) => {
        console.error("Error disconnecting Stream client:", err);
      });
      setVideoClient(undefined);
    };
  }, [user, isLoaded, getToken]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
