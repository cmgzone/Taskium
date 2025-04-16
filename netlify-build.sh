#!/bin/bash

# This script is specifically for Netlify deployment

echo "Building Taskium frontend for Netlify..."

# Only build the frontend for Netlify
cd client
npm install
npm run build

# Copy the build output to the Netlify publish directory
mkdir -p ../dist
cp -r dist/* ../dist/

# Ensure _redirects file exists for SPA routing
if [ ! -f ../dist/_redirects ]; then
  echo "/* /index.html 200" > ../dist/_redirects
  echo "Created _redirects file for SPA routing"
fi

echo "Frontend build complete!"