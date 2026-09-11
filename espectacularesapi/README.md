# espectacularesapi

-Para correr migraciones en docker ejecutar los comandos

docker compose exec api php artisan config:clear
docker compose exec api php artisan cache:clear


# Para crear las tablas 

docker compose exec api php artisan migrate;   

# Para crear el usuario administrador (usuario: admin, password: admin123)

docker compose exec api php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder

## Swagger / OpenAPI

La interfaz interactiva está disponible en `http://localhost:8080/api-docs/` y la
especificación en `http://localhost:8080/api-docs/openapi.json`.

Para regenerarla después de modificar las rutas:

```bash
docker compose exec api composer openapi
```
