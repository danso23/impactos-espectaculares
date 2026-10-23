# Deploy backend

El backend se despliega de forma manual desde GitHub Actions. No se ejecuta en cada push; hay que dispararlo desde **Actions** cuando queramos publicar cambios.

## Workflow

- `.github/workflows/deploy-backend-manual.yml`
- Permite elegir la rama a desplegar.
- El deploy es por FTPS, igual que el frontend, porque en cPanel no tenemos SSH.

## Requisitos

El workflow sube los archivos del backend por FTPS hacia la ruta publicada.

### Secrets necesarios

En **Settings** → **Secrets and variables** → **Actions** agrega:

- `FTP_SERVER`: host FTP/FTPS del servidor.
- `FTP_PORT`: puerto FTP, normalmente `21`.
- `FTP_USERNAME`: usuario FTP.
- `FTP_PASSWORD`: contraseña FTP.
- `BACKEND_FTP_SERVER_DIR`: carpeta destino del backend en el servidor.

## Cómo funciona

El despliegue:

1. Hace checkout de la rama elegida.
2. Sube `espectacularesapi/` por FTPS.
3. Conserva `.env`, `storage/` y `public/storage` en el servidor.

## Cómo ejecutarlo

1. Ve a **Actions**.
2. Abre **Deploy Backend (Manual)**.
3. Haz clic en **Run workflow**.
4. Elige la rama.

## Nota sobre migraciones

Con FTP solamente no podemos ejecutar `php artisan migrate --force` desde GitHub Actions.
Si hay migraciones nuevas, hay que correrlas aparte desde el entorno donde sí tengamos acceso a consola, por ejemplo con Docker local o desde cPanel si tienes terminal disponible.

## Nota para cPanel

Si el backend vive dentro de cPanel, normalmente:

- `BACKEND_FTP_SERVER_DIR` apunta a la carpeta publicada del backend.
- Debe terminar en `/` para que el despliegue no escriba fuera de la carpeta destino.

Eso hace que el deploy quede separado del frontend y solo ocurra cuando lo lancemos manualmente.
