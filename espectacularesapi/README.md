# espectacularesapi

-Para correr migraciones en docker ejecutar los comandos

docker compose exec api php artisan config:clear
docker compose exec api php artisan cache:clear


# Para crear las tablas 

docker compose exec api php artisan migrate;   

# Para crear el usuario administrador (usuario: admin, password: admin123)

docker compose exec api php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder