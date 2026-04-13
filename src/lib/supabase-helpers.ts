import { supabase } from "@/integrations/supabase/client";

export async function uploadFile(file: File, folder: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const { error } = await supabase.storage.from('uploads').upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteFile(url: string) {
  const path = url.split('/uploads/')[1];
  if (path) {
    await supabase.storage.from('uploads').remove([path]);
  }
}
