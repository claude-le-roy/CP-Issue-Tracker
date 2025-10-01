import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActivityLog {
  id: string;
  issue_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const useActivityLogs = (issueId: string) => {
  return useQuery({
    queryKey: ["activity-logs", issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_logs")
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!issueId,
  });
};
