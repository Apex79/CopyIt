export interface Document {
  id: string;
  title: string;
  content: string | null;
  content_type: 'html' | 'markdown' | 'plain_text';
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  created_by: string | null;
}

export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at' | 'published_at'>;
export type DocumentUpdate = Partial<Omit<Document, 'id' | 'created_at'>>;

export interface UploadedFile {
  file: File;
  name: string;
  type: string;
  size: number;
}

export type ContentType = 'html' | 'markdown' | 'plain_text';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface PrivateFile {
  id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}
