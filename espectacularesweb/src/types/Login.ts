export type LoginResponse = {
    message: string
    access_token: string
    refresh_token?: string
    refresh_expires_in?: number
    token_type: "Bearer"
    user?: {
        id: number
        name?: string | null
        email?: string | null
        username?: string | null
        role?: string | null
        roles?: string[] | null
    }
}
