export type AuthUser = {
    id: number
    name: string
    email: string
    username: string
    role: string
}

export type AnyUser = Partial<AuthUser> & {
  nombre?: string
  correo?: string
  user?: any
}