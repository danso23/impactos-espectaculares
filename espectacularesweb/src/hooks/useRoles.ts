import { getUser } from "../lib/auth"

export function useRoles() {
    const user = getUser()
    
    const hasRole = (roleName: string) => {
        if (!user) return false
        
        const rolesArr = user.roles || []
        const roleStr = user.role || ''

        // Check new format (array)
        if (rolesArr.some(r => r.toLowerCase() === 'admin')) return true
        if (rolesArr.includes(roleName)) return true

        // Fallback to old format (string)
        if (roleStr.toLowerCase() === 'admin') return true
        if (roleStr === roleName) return true

        return false
    }

    const hasAnyRole = (roleNames: string[]) => {
        if (!user) return false
        
        const rolesArr = user.roles || []
        const roleStr = user.role || ''

        // Check new format (array)
        if (rolesArr.some(r => r.toLowerCase() === 'admin')) return true
        if (roleNames.some(role => rolesArr.includes(role))) return true

        // Fallback to old format (string)
        if (roleStr.toLowerCase() === 'admin') return true
        if (roleNames.includes(roleStr)) return true

        return false
    }

    const can = (permissionName: string) => {
        if (!user) return false
        if (user.roles?.some(role => role.toLowerCase() === 'admin')) return true
        if (user.role?.toLowerCase() === 'admin') return true
        if (!user.permissions) return false
        return user.permissions.includes(permissionName)
    }

    const isAdmin = () => hasRole('admin')

    return {
        user,
        hasRole,
        hasAnyRole,
        can,
        isAdmin
    }
}
