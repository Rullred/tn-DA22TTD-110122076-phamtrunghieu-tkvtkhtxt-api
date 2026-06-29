#!/bin/bash

# Script to generate RSA key pair for JWT signing
# Requires OpenSSL

echo "Generating RSA 2048-bit key pair for JWT..."

# Create keys directory if it doesn't exist
mkdir -p src/main/resources/keys

# Generate private key
openssl genrsa -out src/main/resources/keys/private_key.pem 2048

# Generate public key from private key
openssl rsa -in src/main/resources/keys/private_key.pem -pubout -out src/main/resources/keys/public_key.pem

echo "Keys generated successfully!"
echo "Private key: src/main/resources/keys/private_key.pem"
echo "Public key: src/main/resources/keys/public_key.pem"
echo ""
echo "IMPORTANT: Add these files to .gitignore to keep them secure!"
