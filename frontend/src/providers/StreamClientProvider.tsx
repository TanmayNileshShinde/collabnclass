import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useUser, useAuth } from "@clerk/clerk-react";

import Loader from "../components/Loader";

const API_KEY = import.meta.env.j6ptqb2dm72c;
const beurl = import.meta.env.VITE_BE_URL;
const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) throw new Error("Stream API key is missing");

    const tokenProvider = async () => {
      try {
        const authToken = await getToken();

        if (!authToken) {
          throw new Error("No authentication token available");
        }

        const response = await fetch(`${beurl}/api/stream/token`, {
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

    // Get display name with better fallbacks
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
    });

    setVideoClient(client);
  }, [user, isLoaded, getToken]);

  if (!videoClient) return <Loader />;

  return <StreamVideo client={videoClient}>{children}</StreamVideo>;
};

export default StreamVideoProvider;
