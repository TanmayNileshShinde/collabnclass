import { useEffect, useState } from 'react';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

interface UseGetCallByIdOptions {
  autoCreatePersonal?: boolean;
  personalHeading?: string;
}

export const useGetCallById = (
  id: string | string[],
  options?: UseGetCallByIdOptions
) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);

  const client = useStreamVideoClient();
  const autoCreatePersonal = Boolean(options?.autoCreatePersonal);
  const personalHeading = options?.personalHeading;

  useEffect(() => {
    const rawId = Array.isArray(id) ? id[0] : id;
    const hasId = Boolean(rawId && rawId.trim());
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
        } else if (!cancelled && autoCreatePersonal && rawId) {
          const personalCall = client.call("default", rawId);
          await personalCall.getOrCreate({
            data: {
              starts_at: new Date().toISOString(),
              custom: {
                heading: personalHeading || "Personal Classroom",
                description: "Personal Classroom Stage Session",
                creatorId: rawId,
              },
            },
          });
          if (!cancelled) {
            setCall(personalCall);
          }
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
  }, [client, id, autoCreatePersonal, personalHeading]);

  return { call, isCallLoading };
};

