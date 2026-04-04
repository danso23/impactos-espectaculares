export type AuthUser = {
  id: number
  name?: string
  username?: string
  email?: string
}

export type AnyUser = Partial<AuthUser> & {
  nombre?: string
  correo?: string
  user?: string
}