import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { betterAuth } from 'better-auth/minimal'
import type { BetterAuthOptions } from 'better-auth/minimal'
import { components } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import authConfig from './auth.config'

function getSiteUrl() {
  // Prefer an explicit Convex env var, but keep a sane local default so pushes
  // don't fail during initial setup.
  return process.env.SITE_URL ?? 'http://localhost:3000'
}

function getConvexSiteUrl() {
  // The Convex .site URL where auth endpoints live (must match Google redirect URI)
  return (
    process.env.CONVEX_SITE_URL ??
    process.env.SITE_URL ??
    'http://localhost:3000'
  )
}

function getGoogleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const convexSiteUrl = getConvexSiteUrl()
  return {
    clientId,
    clientSecret,
    // Explicitly set redirectURI to match Google Console exactly
    redirectURI: `${convexSiteUrl}/api/auth/callback/google`,
  }
}

const siteUrl = getSiteUrl()

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth)

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const google = getGoogleProvider()
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    ...(google
      ? {
          socialProviders: {
            google,
          },
        }
      : {}),
    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions)
}

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.getAuthUser(ctx)
  },
})
