import { useEffect, useState } from 'react';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();

  useEffect(() => {
    const hasId = Array.isArray(id) ? id.length > 0 : Boolean(id && id.trim());
    if (!client || !hasId) {
      setCall(undefined);
      setIsCallLoading(false);
      return;
    }

    let cancelled = false;
    setIsCallLoading(true);
    setCall(undefined);

    const loadCall = async () => {
      try {
        // query filters
        const { calls } = await client.queryCalls({ filter_conditions: { id } });

        if (!cancelled && calls.length > 0) {
          setCall(calls[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) {
          setIsCallLoading(false);
        }
      }
    };

    loadCall();
    return () => {
      cancelled = true;
    };
  }, [client, id]);

  return { call, isCallLoading };
};

