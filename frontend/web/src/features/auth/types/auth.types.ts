
export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
}

export type AuthSession = {
  accessToken: string
  tokenId: string
  user: AuthUser
}

export type RegisterPayload = {
  email: string
  firstName: string
  lastName: string
  password: string
}

export type LoginPayload = {
  email: string
  password: string
}
