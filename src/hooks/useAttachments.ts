import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Attachment {
  id: string;
  issue_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export const useAttachments = (issueId: string) => {
  return useQuery({
    queryKey: ["attachments", issueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!issueId,
  });
};

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      issueId,
      file,
    }: {
      issueId: string;
      file: File;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${issueId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("issue-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error } = await supabase
        .from("attachments")
        .insert({
          issue_id: issueId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", variables.issueId],
      });
      toast.success("File uploaded successfully");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error("Failed to upload file");
    },
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      filePath,
      issueId,
    }: {
      id: string;
      filePath: string;
      issueId: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("issue-attachments")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase.from("attachments").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["attachments", variables.issueId],
      });
      toast.success("Attachment deleted");
    },
    onError: () => {
      toast.error("Failed to delete attachment");
    },
  });
};

export const useDownloadAttachment = () => {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from("issue-attachments")
        .download(filePath);

      if (error) throw error;
      return data;
    },
    onSuccess: (blob, filePath) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filePath.split("/").pop() || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onError: () => {
      toast.error("Failed to download file");
    },
  });
};
