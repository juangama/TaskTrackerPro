# Deploy en Railway

1. Haz fork o clona este repo.
2. En Railway, crea un nuevo proyecto y conecta tu repo.
3. Configura la variable de entorno DATABASE_URL con la URL de Neon o la base de datos de Railway.
4. Railway detectará el Procfile y ejecutará el backend Express.
5. El frontend se sirve desde /dist/public.

## Scripts útiles
- `npm run build`: Compila frontend y backend
- `npm run start`: Inicia el backend Express en producción
- `npm run dev`: Modo desarrollo 