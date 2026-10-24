import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

export interface AttendanceRecord {
  id?: string;
  meeting_id: string;
  user_id: string;
  user_name: string;
  joined_at: string;
  left_at?: string | null;
}

class AttendanceService {
  // Record when a user joins a meeting
  static async recordJoin(meetingId: string, userId: string, userName: string) {
    try {
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not fully configured, skipping attendance tracking.');
        return null;
      }

      // Check if user already has an active session for this meeting
      const { data: existingRecord, error: checkError } = await supabase
        .from('meeting_attendance')
        .select('*')
        .eq('meeting_id', meetingId)
        .eq('user_id', userId)
        .is('left_at', null)
        .maybeSingle();

      if (checkError) {
        console.warn('Error checking existing attendance session:', checkError);
      }

      if (existingRecord) {
        return existingRecord;
      }

      const { data, error } = await supabase
        .from('meeting_attendance')
        .insert({
          meeting_id: meetingId,
          user_id: userId,
          user_name: userName,
          joined_at: new Date().toISOString(),
          left_at: null,
        })
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error recording join:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to record join:', error);
      return null;
    }
  }

  // Record when a user leaves a meeting
  static async recordLeave(meetingId: string, userId: string) {
    try {
      if (!isSupabaseConfigured) return null;

      const { data, error } = await supabase
        .from('meeting_attendance')
        .update({
          left_at: new Date().toISOString(),
        })
        .eq('meeting_id', meetingId)
        .eq('user_id', userId)
        .is('left_at', null)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error recording leave:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to record leave:', error);
      return null;
    }
  }

  // Record leave on tab closure / page unload with keepalive or beacon
  static recordLeaveBeacon(meetingId: string, userId: string) {
    try {
      if (!isSupabaseConfigured) return false;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) return false;

      const endpoint = `${supabaseUrl}/rest/v1/meeting_attendance?meeting_id=eq.${encodeURIComponent(
        meetingId
      )}&user_id=eq.${encodeURIComponent(userId)}&left_at=is.null`;

      const payload = JSON.stringify({
        left_at: new Date().toISOString(),
      });

      // 1. Try keepalive fetch (guaranteed by browser even after page unload)
      if (typeof fetch === 'function') {
        fetch(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`,
            Prefer: 'return=minimal',
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
        return true;
      }

      // 2. Fallback to navigator.sendBeacon
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
        return true;
      }

      return false;
    } catch (e) {
      console.warn('Beacon leave recording failed:', e);
      return false;
    }
  }

  // Get attendance records for a specific meeting
  static async getMeetingAttendance(meetingId: string) {
    try {
      if (!isSupabaseConfigured) return [];

      const { data, error } = await supabase
        .from('meeting_attendance')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching attendance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      return [];
    }
  }

  // Get all attendance records for a user
  static async getUserAttendance(userId: string) {
    try {
      if (!isSupabaseConfigured) return [];

      const { data, error } = await supabase
        .from('meeting_attendance')
        .select('*')
        .eq('user_id', userId)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user attendance:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch user attendance:', error);
      return [];
    }
  }
}

export default AttendanceService;
