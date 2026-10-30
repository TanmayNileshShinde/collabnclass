import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { StreamCall, StreamTheme } from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';
import Loader from '@/components/Loader';

import { useGetCallById } from '@/hooks/useGetCallById';
import { ChatProvider } from '@/contexts/ChatContext';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';

const Meeting = () => {
  const { id } = useParams<{ id: string }>();
  const { isLoaded, user } = useUser();
  const { call, isCallLoading } = useGetCallById(id!);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  if (!isLoaded || isCallLoading) return <Loader />;

  if (!call) return (
    <p className="text-center text-3xl font-bold text-dark-2 dark:text-white transition-colors">
      Call Not Found
    </p>
  );

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
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

