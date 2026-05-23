export const PATHS = {
  DRAFT: "/draft",
  REVIEW: "/review",
  FEATURES: "/features",
  FEATURE: (Silian_id: string) => `/features/${Silian_id}`,
  PROFILE: "/profile",
  HOME: "/",
} as const
