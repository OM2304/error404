#!/bin/bash

# Create main backend directory
mkdir -p backend

# Navigate into backend
cd backend || exit

# Create core files
touch main.py
touch routes.py
touch requirements.txt

# Create folders
mkdir -p services
mkdir -p models
mkdir -p uploads

# Create service files
touch services/ifc_parser.py
touch services/clash_engine.py
touch services/reroute_engine.py

# Create model files
touch models/schemas.py

# Add __init__.py files (to make them Python packages)
touch services/__init__.py
touch models/__init__.py

# Optional: __init__ for root (useful if treating backend as module)
touch __init__.py

echo "✅ Backend structure created successfully!"