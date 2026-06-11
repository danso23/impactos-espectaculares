import React from 'react'
import { useRoles } from '../../hooks/useRoles'

interface CanProps {
    role?: string
    roles?: string[]
    permission?: string
    children: React.ReactNode
    fallback?: React.ReactNode
}

export const Can: React.FC<CanProps> = ({ role, roles, permission, children, fallback = null }) => {
    const { user, hasRole, hasAnyRole, can } = useRoles()

    let allowed = false

    const userRoles = user?.roles || []
    const userRoleStr = user?.role || ''
    const userHasAnyRole = userRoles.length > 0 || userRoleStr.toLowerCase() === 'admin' || userRoles.some(r => r.toLowerCase() === 'admin')

    if (!role && !roles && !permission) {
        // Si no se especifican roles ni permisos, se requiere que el usuario tenga AL MENOS un rol (o ser admin)
        allowed = userHasAnyRole
    } else if (permission) {
        allowed = can(permission)
    } else if (role) {
        allowed = hasRole(role)
    } else if (roles) {
        allowed = hasAnyRole(roles)
    }

    if (!allowed) return <>{fallback}</>

    return <>{children}</>
}
