export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  action: string;
  description?: string | null;
  createdAt: Date;
}
