export interface SoftDeleteFilter {
  deletedAt: null;
}

export function softDeleteFilter(): SoftDeleteFilter {
  return { deletedAt: null };
}
