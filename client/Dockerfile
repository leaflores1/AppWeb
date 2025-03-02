# ---------- Fase 1: Construcción ----------
    FROM node:20 AS build

    WORKDIR /app
    
    # Copiar package.json y package-lock.json
    COPY package*.json ./
    
    # Instalar solo dependencias de producción
    RUN npm ci
    
    # Copiar el resto del código
    COPY . .
    
    # Construir la aplicación con Vite
    RUN npm run build
    
    # ---------- Fase 2: Servidor de archivos estáticos con Node.js ----------
    FROM node:20 AS serve
    
    WORKDIR /app
    
    # Instalar un servidor ligero para servir los archivos estáticos
    RUN npm install -g serve
    
    # Copiar la carpeta de build
    COPY --from=build /app/dist /app/dist
    
    # Exponer el puerto 80 
    EXPOSE 80
    
    # Ejecutar el servidor en el puerto 80
    CMD ["serve", "-s", "dist", "--listen", "80"]



    