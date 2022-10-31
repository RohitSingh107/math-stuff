import json
from solana.keypair import Keypair

def create_keypair_from_file(file_path : str) -> Keypair:

    ## Generate a account (keypair) to transact with our program
    with open(file_path, 'r') as f:
        secret_key = json.load(f)
    return Keypair.from_secret_key(bytes(secret_key))

