# Deploy frontend

`espectacularesweb/dist/` no se sube al repo porque está en `.gitignore`. Si tu cPanel no tiene Node.js, la forma más simple de automatizar es: **build en GitHub Actions** + **deploy por FTPS**.

## GitHub Actions + FTPS

Workflow:

- `.github/workflows/deploy-frontend-ftps.yml` (se ejecuta en cada push a `desarrollo` y también manual con *Run workflow*).

### 1) Crear secrets en GitHub

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

- `FTP_SERVER`: `ftp.enticonfiamos.com.mx`
- `FTP_PORT`: `21`
- `FTP_USERNAME`: `espectaculos@enticonfiamos.com.mx`
- `FTP_PASSWORD`: (tu password de FTP)
- `FTP_SERVER_DIR`: `app.enticonfiamos.com.mx/` (debe terminar en `/`)

Si la ruta no queda bien a la primera, prueba con `/app.enticonfiamos.com.mx/` (depende de cómo el FTP “ancla” el home).

### 2) Ejecutar

- Haz push a `desarrollo` o corre el workflow manualmente en **Actions**.

### Notas

- El deploy usa `protocol: ftps` (FTPS explícito por puerto 21).
- El workflow excluye `.htaccess` para no borrarlo en el servidor; si quieres versionarlo, agrégalo en `espectacularesweb/public/.htaccess`.

