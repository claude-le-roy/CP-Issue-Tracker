import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  department: string;
  location: string;
  component: string;
  operator: string;
  notify_flag: boolean;
  date: string;
  reported_by: string;
  assigned_to: string;
  created_at: string;
  updated_at: string;
  resolved_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface CreateIssueData {
  title: string;
  description: string;
  status: string;
  priority: string;
  department?: string;
  location?: string;
  component?: string;
  operator?: string;
  notify_flag?: boolean;
  date?: string;
}

export const useIssues = () => {
  return useQuery({
    queryKey: ["issues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          profiles!issues_reported_by_fkey (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Issue[];
    },
  });
};

export const useIssue = (id: string) => {
  return useQuery({
    queryKey: ["issues", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("issues")
        .select(`
          *,
          profiles!issues_reported_by_fkey (
            full_name,
            email
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Issue;
    },
    enabled: !!id,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (issueData: CreateIssueData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("issues")
        .insert([{
          title: issueData.title,
          description: issueData.description,
          status: issueData.status as any,
          priority: issueData.priority as any,
          department: issueData.department,
          location: issueData.location,
          component: issueData.component,
          operator: issueData.operator,
          notify_flag: issueData.notify_flag,
          date: issueData.date,
          reported_by: user.id,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (newIssue) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });

      const previousIssues = queryClient.getQueryData(["issues"]);

      queryClient.setQueryData(["issues"], (old: Issue[] = []) => [
        {
          id: "temp-" + Date.now(),
          ...newIssue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Issue,
        ...old,
      ]);

      return { previousIssues };
    },
    onError: (err, newIssue, context) => {
      queryClient.setQueryData(["issues"], context?.previousIssues);
      toast.error("Failed to create issue");
    },
    onSuccess: () => {
      toast.success("Issue created successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: any;
    }) => {
      const { data: updated, error } = await supabase
        .from("issues")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["issues", id] });
      await queryClient.cancelQueries({ queryKey: ["issues"] });

      const previousIssue = queryClient.getQueryData(["issues", id]);
      const previousIssues = queryClient.getQueryData(["issues"]);

      queryClient.setQueryData(["issues", id], (old: Issue) => ({
        ...old,
        ...data,
        updated_at: new Date().toISOString(),
      }));

      queryClient.setQueryData(["issues"], (old: Issue[] = []) =>
        old.map((issue) =>
          issue.id === id
            ? { ...issue, ...data, updated_at: new Date().toISOString() }
            : issue
        )
      );

      return { previousIssue, previousIssues };
    },
    onError: (err, { id }, context) => {
      if (context?.previousIssue) {
        queryClient.setQueryData(["issues", id], context.previousIssue);
      }
      if (context?.previousIssues) {
        queryClient.setQueryData(["issues"], context.previousIssues);
      }
      toast.error("Failed to update issue");
    },
    onSuccess: () => {
      toast.success("Issue updated successfully");
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["issues", id] });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("issues").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["issues"] });

      const previousIssues = queryClient.getQueryData(["issues"]);

      queryClient.setQueryData(["issues"], (old: Issue[] = []) =>
        old.filter((issue) => issue.id !== id)
      );

      return { previousIssues };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["issues"], context?.previousIssues);
      toast.error("Failed to delete issue");
    },
    onSuccess: () => {
      toast.success("Issue deleted successfully");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
};
