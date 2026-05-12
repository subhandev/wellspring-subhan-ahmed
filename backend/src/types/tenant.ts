/** Branded string for tenant-scoped data (creator id). */
export type TenantId = string & { readonly __brand: "TenantId" };

export function toTenantId(id: string): TenantId {
  return id as TenantId;
}
