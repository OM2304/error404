#!/bin/bash

# Create frontend root
mkdir -p frontend

# Navigate into frontend
cd frontend || exit

# Create main HTML files
touch index.html
touch upload.html
touch results.html

# Create CSS folder and file
mkdir -p css
touch css/style.css

# Create JS folder and files
mkdir -p js
touch js/upload.js
touch js/results.js
touch js/api.js

echo "✅ Frontend (HTML/CSS/JS) structure created successfully!"