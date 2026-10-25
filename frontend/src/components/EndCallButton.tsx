import { useCall, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';

import { Button } from './ui/button';

const EndCallButton = () => {
  const call = useCall();
  const navigate = useNavigate();

  if (!call)
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );

  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#participant-state-3
  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant();

  const isMeetingOwner =
    localParticipant &&
    call.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  if (!isMeetingOwner) return null;

  const endCall = async () => {
    try {
      await call.sendCustomEvent({
        type: 'meeting-ended-by-host',
        endedAt: new Date().toISOString(),
        endedBy: localParticipant?.name || 'Classroom Host',
      });
    } catch (e) {
      console.warn('Failed to broadcast end-call event:', e);
    }
    await call.endCall();
    navigate('/');
  };

  return (
    <Button onClick={endCall} variant="destructive" className="font-semibold">
      End call for everyone
    </Button>
  );
};

export default EndCallButton;
