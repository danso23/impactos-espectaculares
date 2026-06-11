# Deploy backend

El backend se despliega de forma manual desde GitHub Actions. No se ejecuta en cada push; hay que dispararlo desde **Actions** cuando queramos publicar cambios.

## Workflow

- `.github/workflows/deploy-backend-manual.yml`
- Permite elegir la rama a desplegar.
- Permite decidir si se corren migraciones en ese despliegue.

## Requisitos

El workflow se conecta al servidor por SSH y copia el backend desde la ruta del repo en el servidor hacia la ruta publicada.

### Secrets necesarios

En **Settings** → **Secrets and variables** → **Actions** agrega:

- `SSH_HOST`: host SSH del servidor.
- `SSH_PORT`: puerto SSH, normalmente `22`.
- `SSH_USER`: usuario SSH.
- `SSH_KEY`: llave privada SSH.
- `BACKEND_SOURCE_PATH`: ruta del repositorio en el servidor.
- `BACKEND_TARGET_PATH`: ruta final donde vive el backend publicado.

### Variable opcional

- `PHP_BIN`: ruta del binario de PHP en el servidor. Si no se define, el workflow usa `php`.

## Cómo funciona

El despliegue:

1. Sincroniza `espectacularesapi/` hacia la ruta publicada.
2. Recrea el symlink de `public/storage` si no existe.
3. Limpia cachés de `config` y `cache`.
4. Si se marca la opción, corre `php artisan migrate --force`.

## Cómo ejecutarlo

1. Ve a **Actions**.
2. Abre **Deploy Backend (Manual)**.
3. Haz clic en **Run workflow**.
4. Elige la rama.
5. Activa o desactiva `run_migrations`.

## Nota para cPanel

Si el backend vive dentro de cPanel Git Version Control, normalmente:

- `BACKEND_SOURCE_PATH` apunta a la ruta del checkout del repositorio.
- `BACKEND_TARGET_PATH` apunta a la ruta publicada del backend.

Eso hace que el deploy quede separado del frontend y solo ocurra cuando lo lancemos manualmente.
