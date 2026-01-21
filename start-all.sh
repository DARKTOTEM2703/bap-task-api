#!/bin/bash

# Script para iniciar todo el sistema (Backend + Base de datos + MinIO)

set -e

echo "========================================="
echo "   TASK MANAGEMENT API - INICIO COMPLETO"
echo "========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar si los contenedores están corriendo
CONTAINERS=$(docker compose ps -q 2>/dev/null || true)

if [ -z "$CONTAINERS" ]; then
    echo -e "${YELLOW}▶ Iniciando contenedores Docker (MySQL, phpMyAdmin, MinIO)...${NC}"
    docker compose up -d
    echo -e "${YELLOW}▶ Esperando que MySQL inicialice (20 segundos)...${NC}"
    sleep 20
else
    echo -e "${GREEN}✓ Contenedores ya están corriendo${NC}"
fi

echo ""
echo -e "${YELLOW}▶ Instalando dependencias...${NC}"
npm install --silent

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}✓ SISTEMA LISTO${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}Iniciando backend en modo desarrollo...${NC}"
echo ""
echo -e "${GREEN} API:${NC}              http://localhost:3000"
echo -e "${GREEN} Swagger:${NC}          http://localhost:3000/api"
echo -e "${GREEN} phpMyAdmin:${NC}       http://localhost:8080 (user: bap_user)"
echo -e "${GREEN} MinIO Console:${NC}    http://localhost:9001 (user: minioadmin)"
echo ""
echo -e "${YELLOW}Para probar los endpoints, ejecuta en otra terminal:${NC}"
echo "   ./test-api.sh"
echo ""
npm run start:dev
