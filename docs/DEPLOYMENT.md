# Deployment Guide

## Local
copy .env.example .env
docker compose up --build

## Production
- Use a strong JWT_SECRET
- Change default admin password
- Run behind a reverse proxy
