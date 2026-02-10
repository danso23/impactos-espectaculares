export type LoginResponse = {
    message: string
    access_token: string
    refresh_token?: string
    token_type: "Bearer"
    user: string
}