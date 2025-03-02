# ---------- Construcción del backend ----------
    FROM node:20

    WORKDIR /app
    
    # Copiar y construir dependencias
    COPY package*.json ./
    RUN npm install --production
    
    # Copiar el resto del código fuente
    COPY . .
    
    # Exponer el puerto
    EXPOSE 3000
    
    # Ejecutar el backend
    CMD ["npm", "run", "start"]
    