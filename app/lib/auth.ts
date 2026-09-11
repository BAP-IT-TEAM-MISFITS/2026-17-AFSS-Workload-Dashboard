import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { google } from 'googleapis'

const ALLOWED_GROUP = 'technicalafss-deployment@redadair.com.au'

async function checkGroupMembership(email: string): Promise<boolean> {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKey) {
    console.error('[auth] Service account not configured — denying access')
    return false
  }

  // No `subject` here on purpose. The service account reads the group as
  // itself; its read access comes from being a member of ALLOWED_GROUP. This
  // previously used domain-wide delegation to impersonate a named admin, which
  // meant every sign-in depended on one person keeping their admin role — when
  // that role was removed during offboarding, the app locked everybody out.
  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/cloud-identity.groups.readonly'],
  })

  const cloudIdentity = google.cloudidentity({ version: 'v1', auth })

  const { data: group } = await cloudIdentity.groups.lookup({
    'groupKey.id': ALLOWED_GROUP,
  })
  if (!group.name) throw new Error(`Group ${ALLOWED_GROUP} could not be resolved`)

  // Lists members rather than calling memberships.lookup, which answers "not a
  // member" with a 403 — indistinguishable from the 403 returned if the service
  // account ever loses access to the group. Listing keeps a normal rejection
  // (no match) separate from a broken configuration (throws), so the latter
  // can't quietly present itself as the former.
  const target = email.toLowerCase()
  let pageToken: string | undefined

  do {
    const { data } = await cloudIdentity.groups.memberships.list({
      parent: group.name,
      pageSize: 500,
      pageToken,
    })
    for (const member of data.memberships ?? []) {
      if (member.preferredMemberKey?.id?.toLowerCase() === target) return true
    }
    pageToken = data.nextPageToken ?? undefined
  } while (pageToken)

  return false
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      try {
        const allowed = await checkGroupMembership(user.email)
        if (!allowed) console.warn(`[auth] Access denied: ${user.email} is not in ${ALLOWED_GROUP}`)
        return allowed
      } catch (err) {
        // Reaching here means the group could not be read at all, so *every*
        // sign-in is failing, not just this one. Say so plainly — the previous
        // wording read like a routine rejection and cost hours of diagnosis.
        console.error(
          `[auth] CONFIGURATION FAULT — cannot read ${ALLOWED_GROUP}. ` +
            `ALL sign-ins will fail until this is fixed. Check that ` +
            `${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL} is still a member of the ` +
            `group and that the Cloud Identity API is enabled on the project.`,
          err,
        )
        return false
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
