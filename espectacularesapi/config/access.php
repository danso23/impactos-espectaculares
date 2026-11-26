<?php

return [
    'actions' => [
        'view' => 'Ver',
        'edit' => 'Editar',
        'delete' => 'Eliminar',
    ],

    'modules' => [
        'spaces' => 'Espacios',
        'quotes' => 'Cotizaciones',
        'rentals' => 'Rentas',
        'users' => 'Usuarios',
        'roles' => 'Roles',
        'payments' => 'Pagos',
        'leads' => 'Prospectos',
        'clients' => 'Clientes',
        'providers' => 'Proveedores',
        'caseros' => 'Caseros',
        'services' => 'Servicios',
        'collaborators' => 'Colaboradores',
    ],

    // Permisos puntuales que no siguen la matriz módulo × acción.
    'special' => [
        'rentals.edit_start_date' => [
            'module' => 'rentals',
            'label' => 'Editar fecha de inicio de rentas confirmadas',
        ],
    ],
];
