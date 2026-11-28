import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { CallingState, StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useParams, useSearchParams } from 'react-router-dom';
import Loader from '@/components/Loader';

import { useGetCallById } from '@/hooks/useGetCallById';
import { ChatProvider } from '@/contexts/ChatContext';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const Meeting = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { isLoaded, user } = useUser();
  const isPersonalRoom = searchParams.get('personal') === 'true';
  const personalHeading = `${user?.fullName || user?.username || 'Host'}'s Personal Classroom`;
  const { call, isCallLoading } = useGetCallById(id!, {
    autoCreatePersonal: Boolean(isPersonalRoom && user?.id && id === user.id),
    personalHeading,
  });
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Stop media devices and leave call cleanly when navigating away (e.g. Browser Back)
  useEffect(() => {
    if (!call) return;
    return () => {
      call.camera.disable().catch(() => {});
      call.microphone.disable().catch(() => {});
      if (call.state.callingState === CallingState.JOINED) {
        call.leave().catch(() => {});
      }
    };
  }, [call]);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) return <Alert title="Classroom Not Found or Concluded" />;

  // custom call type
  const notAllowed =
    call.type === 'invited' &&
    (!user || !call.state.members?.find((m) => m?.user?.id === user.id));

  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;

  return (
    <main className="h-screen w-full">
      <StreamCall call={call}>
        <StreamTheme>
          <ChatProvider>
            {!isSetupComplete ? (
              <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
            ) : (
              <MeetingRoom />
            )}
          </ChatProvider>
        </StreamTheme>
      </StreamCall>
    </main>
  );
};

export default Meeting;

