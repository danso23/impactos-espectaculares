SET NAMES utf8mb4;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `companies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `legal_name` varchar(200) NOT NULL,
  `rfc` varchar(20) DEFAULT NULL,
  `tax_regime` varchar(100) DEFAULT NULL,
  `address_line` varchar(255) DEFAULT NULL,
  `neighborhood` varchar(120) DEFAULT NULL,
  `city` varchar(120) DEFAULT NULL,
  `state` varchar(120) DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `country` varchar(2) NOT NULL DEFAULT 'MX',
  `phone` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `default_terms_html` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `agencies` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `legal_name` varchar(200) DEFAULT NULL,
  `contact_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `discount_type` enum('none','percent','fixed') NOT NULL DEFAULT 'none',
  `discount_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `discount_applies_to` enum('rentals_only','all_items') NOT NULL DEFAULT 'rentals_only',
  `commission_type` enum('none','percent','fixed') NOT NULL DEFAULT 'none',
  `commission_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `commission_applies_to` enum('rentals_only','subtotal_after_discount') NOT NULL DEFAULT 'subtotal_after_discount',
  `notes` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `services` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(50) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 16.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `services_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `company_letterheads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `company_id` bigint(20) unsigned NOT NULL,
  `name` varchar(120) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `template_key` varchar(100) NOT NULL,
  `header_image_path` varchar(255) DEFAULT NULL,
  `footer_image_path` varchar(255) DEFAULT NULL,
  `watermark_image_path` varchar(255) DEFAULT NULL,
  `primary_color` varchar(20) DEFAULT NULL,
  `secondary_color` varchar(20) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `company_letterheads_company_id_index` (`company_id`),
  KEY `company_letterheads_company_id_is_active_index` (`company_id`,`is_active`),
  CONSTRAINT `company_letterheads_company_id_foreign`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `companies` (
  `key`, `name`, `legal_name`, `rfc`, `email`, `phone`, `city`, `state`, `country`,
  `default_terms_html`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'espectaculares_principal',
  'Espectaculares',
  'Espectaculares S.A. de C.V.',
  'ESP010101ABC',
  'ventas@espectaculares.mx',
  '9990000000',
  'Merida',
  'Yucatan',
  'MX',
  '<p>Precios sujetos a disponibilidad y cambio sin previo aviso.</p><p>Vigencia de 15 dias naturales.</p>',
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `companies` WHERE `key` = 'espectaculares_principal'
);

INSERT INTO `companies` (
  `key`, `name`, `legal_name`, `rfc`, `email`, `phone`, `city`, `state`, `country`,
  `default_terms_html`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'espectaculares_corporativo',
  'Espectaculares Corporativo',
  'Corporativo Espectaculares del Sureste S.A. de C.V.',
  'COR010101ABC',
  'corporativo@espectaculares.mx',
  '9990000001',
  'Merida',
  'Yucatan',
  'MX',
  '<p>Condiciones corporativas aplican para esta emision.</p>',
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `companies` WHERE `key` = 'espectaculares_corporativo'
);

INSERT INTO `company_letterheads` (
  `company_id`, `name`, `code`, `description`, `template_key`,
  `primary_color`, `secondary_color`, `is_default`, `is_active`, `created_at`, `updated_at`
)
SELECT
  c.`id`,
  'Membretado Principal',
  'MAIN',
  'Plantilla principal para cotizaciones comerciales',
  'default_blue',
  '#1D6FA5',
  '#2CA6D9',
  1,
  1,
  NOW(),
  NOW()
FROM `companies` c
WHERE c.`key` = 'espectaculares_principal'
  AND NOT EXISTS (
    SELECT 1
    FROM `company_letterheads` cl
    WHERE cl.`company_id` = c.`id` AND cl.`code` = 'MAIN'
  );

INSERT INTO `company_letterheads` (
  `company_id`, `name`, `code`, `description`, `template_key`,
  `primary_color`, `secondary_color`, `is_default`, `is_active`, `created_at`, `updated_at`
)
SELECT
  c.`id`,
  'Membretado Corporativo',
  'CORP',
  'Plantilla corporativa',
  'corporate_dark',
  '#16324F',
  '#4F6D8A',
  1,
  1,
  NOW(),
  NOW()
FROM `companies` c
WHERE c.`key` = 'espectaculares_corporativo'
  AND NOT EXISTS (
    SELECT 1
    FROM `company_letterheads` cl
    WHERE cl.`company_id` = c.`id` AND cl.`code` = 'CORP'
  );

INSERT INTO `agencies` (
  `name`, `legal_name`, `contact_name`, `email`, `phone`,
  `discount_type`, `discount_value`, `discount_applies_to`,
  `commission_type`, `commission_value`, `commission_applies_to`,
  `notes`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'Agencia Demo',
  'Agencia Demo S.A. de C.V.',
  'Ejecutivo Demo',
  'agencia@demo.mx',
  '9991000000',
  'percent',
  10.00,
  'rentals_only',
  'percent',
  12.00,
  'subtotal_after_discount',
  'Configuracion inicial para pruebas',
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `agencies` WHERE `name` = 'Agencia Demo'
);

INSERT INTO `services` (
  `key`, `name`, `description`, `base_price`, `tax_rate`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'instalacion',
  'Instalacion',
  'Instalacion de lona o material publicitario',
  1500.00,
  16.00,
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `services` WHERE `key` = 'instalacion'
);

INSERT INTO `services` (
  `key`, `name`, `description`, `base_price`, `tax_rate`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'impresion',
  'Impresion',
  'Impresion de lona',
  2500.00,
  16.00,
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `services` WHERE `key` = 'impresion'
);

INSERT INTO `services` (
  `key`, `name`, `description`, `base_price`, `tax_rate`, `is_active`, `created_at`, `updated_at`
)
SELECT
  'desinstalacion',
  'Desinstalacion',
  'Retiro de material existente',
  900.00,
  16.00,
  1,
  NOW(),
  NOW()
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM `services` WHERE `key` = 'desinstalacion'
);

COMMIT;
