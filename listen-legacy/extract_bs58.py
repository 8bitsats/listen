#!/usr/bin/env python3
import json
import sys
import base58

def keypair_to_bs58(keypair_file):
    with open(keypair_file, 'r') as f:
        keypair_data = json.load(f)
    
    # Convert the array of integers to bytes
    keypair_bytes = bytes(keypair_data)
    
    # Encode to base58
    bs58_encoded = base58.b58encode(keypair_bytes).decode('utf-8')
    
    return bs58_encoded

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python extract_bs58.py <keypair_file>")
        sys.exit(1)
    
    keypair_file = sys.argv[1]
    try:
        bs58_key = keypair_to_bs58(keypair_file)
        print(bs58_key)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
