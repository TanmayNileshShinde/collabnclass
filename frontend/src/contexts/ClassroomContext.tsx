import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useCall } from "@stream-io/video-react-sdk";
import { useUser } from "@clerk/clerk-react";
import { useToast } from "@/components/ui/use-toast";

export interface RaisedHandInfo {
  userId: string;
  userName: string;
  userImage?: string;
  raisedAt: number;
}

export interface ClassroomContextType {
  raisedHands: Map<string, RaisedHandInfo>;
  raisedHandsList: RaisedHandInfo[];
  isHandRaised: boolean;
  isHost: boolean;
  toggleHandRaise: () => Promise<void>;
  lowerHand: (userId: string) => Promise<void>;
  lowerAllHands: () => Promise<void>;
  muteAll: () => Promise<void>;
  muteParticipant: (userId: string) => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType | null>(null);

/**
 * Synthesizes a soft, pleasant chime using the Web Audio API
 * when a student raises their hand. Zero external asset dependencies.
 */
const playHandRaiseChime = () => {
  try {
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Autoplay restrictions or headless environment
  }
};

export const ClassroomProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const call = useCall();
  const { user } = useUser();
  const { toast } = useToast();

  const [raisedHands, setRaisedHands] = useState<Map<string, RaisedHandInfo>>(
    new Map()
  );

  // Determine if the local user is the Host / Instructor
  const isHost = useMemo(() => {
    if (!call || !user) return false;
    const callCreatorId = call.state.createdBy?.id;
    const customCreatorId = call.state.custom?.creatorId;
    return callCreatorId === user.id || customCreatorId === user.id;
  }, [call, user]);

  const isHandRaised = useMemo(() => {
    if (!user) return false;
    return raisedHands.has(user.id);
  }, [raisedHands, user]);

  const raisedHandsList = useMemo(() => {
    return Array.from(raisedHands.values()).sort(
      (a, b) => a.raisedAt - b.raisedAt
    );
  }, [raisedHands]);

  // Listen to custom Stream events for Hand Raises and Host Mute actions
  useEffect(() => {
    if (!call) return;

    const handleCustomEvent = (event: any) => {
      if (!event) return;
      // Stream Video SDK delivers custom events with event.type === "custom" and the payload in event.custom
      const payload = event.custom || event;
      const eventType = payload.type || event.type;
      const customData = payload.custom || payload;
      if (!eventType) return;

      if (eventType === "classroom-hand-raise") {
        const { userId, userName, userImage, isRaised, raisedAt } = customData;
        if (!userId) return;

        setRaisedHands((prev) => {
          const next = new Map(prev);
          if (isRaised) {
            next.set(userId, {
              userId,
              userName: userName || "Participant",
              userImage,
              raisedAt: raisedAt || Date.now(),
            });

            // If another user raised their hand and local user is host, notify
            if (userId !== user?.id) {
              playHandRaiseChime();
              toast({
                title: "✋ Hand Raised",
                description: `${userName || "A student"} raised their hand.`,
              });
            }
          } else {
            next.delete(userId);
          }
          return next;
        });
      } else if (eventType === "classroom-lower-all-hands") {
        setRaisedHands(new Map());
      } else if (eventType === "classroom-mute-all") {
        if (!isHost) {
          toast({
            title: "🔇 Microphones Muted",
            description: "The host has muted all participants.",
          });
        }
      } else if (eventType === "classroom-request-state") {
        // Sync active state to newcomer if we have a hand raised
        if (user && raisedHands.has(user.id)) {
          const myInfo = raisedHands.get(user.id)!;
          call
            .sendCustomEvent({
              type: "classroom-hand-raise",
              custom: {
                userId: myInfo.userId,
                userName: myInfo.userName,
                userImage: myInfo.userImage,
                isRaised: true,
                raisedAt: myInfo.raisedAt,
              },
            })
            .catch(() => {});
        }
      }
    };

    // Clean up hands when participant leaves
    const handleParticipantLeft = (event: any) => {
      const leftId = event?.participant?.userId;
      if (leftId) {
        setRaisedHands((prev) => {
          if (prev.has(leftId)) {
            const next = new Map(prev);
            next.delete(leftId);
            return next;
          }
          return prev;
        });
      }
    };

    call.on("custom", handleCustomEvent);
    call.on("participantLeft", handleParticipantLeft);

    // Request active hand-raise state upon joining
    if (user?.id) {
      call
        .sendCustomEvent({
          type: "classroom-request-state",
          custom: { requesterId: user.id },
        })
        .catch(() => {});
    }

    return () => {
      call.off("custom", handleCustomEvent);
      call.off("participantLeft", handleParticipantLeft);
    };
  }, [call, isHost, user, raisedHands, toast]);

  // Toggle local hand raise
  const toggleHandRaise = useCallback(async () => {
    if (!call || !user) return;
    const nextState = !isHandRaised;
    const now = Date.now();
    const userName =
      user.fullName || user.username || user.firstName || "Student";
    const userImage = user.imageUrl;

    try {
      await call.sendCustomEvent({
        type: "classroom-hand-raise",
        custom: {
          userId: user.id,
          userName,
          userImage,
          isRaised: nextState,
          raisedAt: now,
        },
      });

      setRaisedHands((prev) => {
        const next = new Map(prev);
        if (nextState) {
          next.set(user.id, {
            userId: user.id,
            userName,
            userImage,
            raisedAt: now,
          });
        } else {
          next.delete(user.id);
        }
        return next;
      });

      toast({
        title: nextState ? "✋ Hand Raised" : "Hand Lowered",
        description: nextState
          ? "The host and class can now see your raised hand."
          : "Your hand has been lowered.",
      });
    } catch (err) {
      console.error("Failed to toggle hand raise:", err);
      toast({
        title: "Action Failed",
        description: "Could not send hand raise signal.",
        variant: "destructive",
      });
    }
  }, [call, user, isHandRaised, toast]);

  // Lower an individual hand (by owner or host)
  const lowerHand = useCallback(
    async (targetUserId: string) => {
      if (!call) return;
      try {
        await call.sendCustomEvent({
          type: "classroom-hand-raise",
          custom: {
            userId: targetUserId,
            userName: raisedHands.get(targetUserId)?.userName || "",
            isRaised: false,
            raisedAt: Date.now(),
          },
        });

        setRaisedHands((prev) => {
          const next = new Map(prev);
          next.delete(targetUserId);
          return next;
        });
      } catch (err) {
        console.error("Failed to lower hand:", err);
      }
    },
    [call, raisedHands]
  );

  // Lower all raised hands (host only)
  const lowerAllHands = useCallback(async () => {
    if (!call) return;
    try {
      await call.sendCustomEvent({
        type: "classroom-lower-all-hands",
        custom: { timestamp: Date.now() },
      });
      setRaisedHands(new Map());
      toast({
        title: "✋ Hands Cleared",
        description: "All raised hands have been lowered.",
      });
    } catch (err) {
      console.error("Failed to clear hands:", err);
    }
  }, [call, toast]);

  // Mute all other participants (host only)
  const muteAll = useCallback(async () => {
    if (!call) return;
    try {
      if (typeof call.muteOthers === "function") {
        await call.muteOthers("audio");
      } else if (typeof call.muteAllUsers === "function") {
        await call.muteAllUsers("audio");
      }

      await call.sendCustomEvent({
        type: "classroom-mute-all",
        custom: {
          hostName: user?.fullName || user?.username || "Host",
          timestamp: Date.now(),
        },
      });

      toast({
        title: "🔇 All Participants Muted",
        description: "Microphones have been muted for all attendees.",
      });
    } catch (err) {
      console.error("Failed to mute all participants:", err);
      toast({
        title: "Mute All Failed",
        description: "Unable to mute participants. Verify host permissions.",
        variant: "destructive",
      });
    }
  }, [call, user, toast]);

  // Mute a specific participant (host only)
  const muteParticipant = useCallback(
    async (targetUserId: string) => {
      if (!call) return;
      try {
        if (typeof call.muteUser === "function") {
          await call.muteUser(targetUserId, "audio");
        }
        toast({
          title: "Participant Muted",
          description: "Microphone was muted by host.",
        });
      } catch (err) {
        console.error(`Failed to mute user ${targetUserId}:`, err);
        toast({
          title: "Mute Failed",
          description: "Could not mute participant.",
          variant: "destructive",
        });
      }
    },
    [call, toast]
  );

  return (
    <ClassroomContext.Provider
      value={{
        raisedHands,
        raisedHandsList,
        isHandRaised,
        isHost,
        toggleHandRaise,
        lowerHand,
        lowerAllHands,
        muteAll,
        muteParticipant,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = (): ClassroomContextType => {
  const context = useContext(ClassroomContext);
  if (!context) {
    // Safe fallback if used outside ClassroomProvider
    return {
      raisedHands: new Map(),
      raisedHandsList: [],
      isHandRaised: false,
      isHost: false,
      toggleHandRaise: async () => {},
      lowerHand: async () => {},
      lowerAllHands: async () => {},
      muteAll: async () => {},
      muteParticipant: async () => {},
    };
  }
  return context;
};
