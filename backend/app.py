import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from typing import Dict, Any, Optional
from datetime import datetime # For timestamps
import hashlib
import time
import uuid
import google.generativeai as genai
from PIL import Image
import io
import json
from web3 import Web3
# --- CORRECTED IMPORT FOR web3.py v7+ ---
from web3.middleware import ExtraDataToPOAMiddleware # Use the new middleware name
# --- END CORRECTION ---
import hashlib
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app) # Allow all origins for development

# --- Market API Config ---
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b")
MARKET_API_BASE_URL = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"

# --- Gemini API Config ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None
try:
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Gemini Model Initialized.")
    else:
        print("⚠️ GEMINI_API_KEY not found. Gemini features disabled.")
except Exception as e:
    print(f"❌ Error initializing Gemini: {e}")

# --- Polygon Amoy/Blockchain Config ---
AMOY_RPC_URL = os.getenv("POLYGON_AMOY_RPC_URL")
AMOY_CHAIN_ID = int(os.getenv("AMOY_CHAIN_ID", 80002))
CONTRACT_ADDRESS = os.getenv("PROOF_STORAGE_CONTRACT_ADDRESS")
BACKEND_PRIVATE_KEY = os.getenv("BACKEND_WALLET_PRIVATE_KEY")

# Load Contract ABI
contract_abi = None
try:
    # Adjust path if your ABI file is elsewhere
    abi_path = os.path.join(os.path.dirname(__file__), 'contracts', 'ProofStorage_abi.json')
    with open(abi_path, 'r') as f:
        contract_abi = json.load(f)
        print(f"✅ Loaded Contract ABI from: {abi_path}")
except Exception as e:
    print(f"❌ Error loading contract ABI: {e}. Blockchain features might fail.")

# Initialize Web3 for Amoy
w3 = None
backend_account = None
proof_storage_contract = None

if AMOY_RPC_URL and CONTRACT_ADDRESS and contract_abi and BACKEND_PRIVATE_KEY:
    try:
        w3 = Web3(Web3.HTTPProvider(AMOY_RPC_URL))

        # --- CORRECTED MIDDLEWARE INJECTION ---
        # Inject the renamed middleware
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
        # --- END CORRECTION ---

        if w3.is_connected():
            print(f"✅ Connected to Polygon Amoy RPC: {AMOY_RPC_URL}")
            backend_account = w3.eth.account.from_key(BACKEND_PRIVATE_KEY)
            checksum_contract_address = Web3.to_checksum_address(CONTRACT_ADDRESS)
            proof_storage_contract = w3.eth.contract(address=checksum_contract_address, abi=contract_abi)

            # --- Owner Check ---
            try:
                contract_owner = proof_storage_contract.functions.owner().call()
                print(f"✅ Smart Contract Owner: {contract_owner}")
                if contract_owner.lower() != backend_account.address.lower():
                    print(f"⚠️ WARNING: Backend wallet ({backend_account.address}) is NOT the owner of the contract ({contract_owner}). Calls to storeProof will likely fail.")
                else:
                    print("✅ Backend wallet IS the owner of the contract.")
            except Exception as owner_e:
                print(f"⚠️ Could not verify contract owner: {owner_e}.")
            # --- End Owner Check ---

            print(f"✅ Loaded ProofStorage contract (Amoy) at: {checksum_contract_address}")
            print(f"✅ Backend Wallet Address: {backend_account.address}")
        else:
            print(f"⚠️ Failed to connect to Polygon Amoy RPC: {AMOY_RPC_URL}")
            w3 = None
    except ImportError as ie:
        # Add a check specifically for the middleware import if needed
        if 'ExtraDataToPOAMiddleware' in str(ie):
            print(f"❌ Critical Import Error: Could not find 'ExtraDataToPOAMiddleware'. You might need web3.py v7.0.0 or later. Current version might be older.")
        else:
            print(f"❌ An ImportError occurred during Web3 initialization: {ie}")
        w3 = None
    except Exception as e:
        print(f"❌ Error initializing Web3 or contract: {e}")
        w3 = None
else:
    print("⚠️ Blockchain configuration incomplete in .env. Blockchain features disabled.")

# --- SIMULATED DATABASE ---
# In-memory list to store claims (replace with MongoDB later)
SIMULATED_DB: Dict[str, list[Dict[str, Any]]] = {
    "claims": []
}
# --- END SIMULATED DATABASE ---

# --- Blockchain Helper Function (Refactored) ---
def store_proof_on_blockchain(data_to_hash: Any, metadata_string: str) -> Optional[str]:
    """Hashes data, stores proof on blockchain, returns txHash or None on failure."""
    if not proof_storage_contract or not w3 or not backend_account:
        print("❌ Cannot store proof: Blockchain service not configured.")
        return None

    try:
        data_string = json.dumps(data_to_hash, sort_keys=True)
        data_bytes = data_string.encode('utf-8')
        data_hash = hashlib.sha256(data_bytes).digest() # bytes32
        metadata_bytes = metadata_string.encode('utf-8')

        print(f"Hashing for proof: {data_string}")
        print(f"Proof Hash (bytes): {data_hash.hex()}")

        # Check if proof exists first (optional, saves gas)
        proof_exists = proof_storage_contract.functions.verifyProof(data_hash).call()
        if proof_exists:
            print(f"Proof hash {data_hash.hex()} already exists on chain.")
            # How to handle? Maybe find the existing tx? For now, we'll just skip storing again.
            # If skipping, we need a way to find the original txHash to associate with the claim.
            # For simplicity now, let's assume duplicates are unlikely or okay to re-submit (inefficient).
            # If you want to prevent filing claim if proof exists, raise an exception here.

        nonce = w3.eth.get_transaction_count(backend_account.address)
        gas_limit = 300000 # Start with a reasonable default
        try:
            gas_estimate = proof_storage_contract.functions.storeProof(
                data_hash, metadata_bytes
            ).estimate_gas({'from': backend_account.address})
            gas_limit = int(gas_estimate * 1.2) # Add buffer
        except Exception as estimate_e:
            print(f"⚠️ Gas estimation failed: {estimate_e}. Using default gas limit {gas_limit}.")

        tx_params = {
            'chainId': AMOY_CHAIN_ID,
            'gas': gas_limit,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
            'from': backend_account.address
        }
        store_proof_func = proof_storage_contract.functions.storeProof(data_hash, metadata_bytes)
        tx = store_proof_func.build_transaction(tx_params)
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=BACKEND_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hex = tx_hash.hex()

        print(f"Proof transaction submitted to Polygon Amoy. Tx Hash: {tx_hex}")
        return tx_hex # Return the transaction hash

    except Exception as e:
        print(f"❌ Error storing proof on blockchain: {str(e)}")
        # Check for specific errors if needed
        return None # Indicate failure

# --- Market API Functions ---
def fetch_market_data(filters):
    """Fetches data from the data.gov.in API based on filters."""
    if not DATA_GOV_API_KEY:
        return {
            "success": False,
            "data": None,
            "error": "DATA_GOV_API_KEY not configured in environment variables"
        }

    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "limit": 1000,
    }

    filter_mapping = {
        "state": "state",
        "district": "district",
        "market": "market",
        "commodity": "commodity",
    }

    # Add filters to params
    for key, api_field in filter_mapping.items():
        value = filters.get(key)
        if value:
            params[f"filters[{api_field}]"] = value

    print(f"📊 Requesting Market API with params: {params}")

    try:
        response = requests.get(MARKET_API_BASE_URL, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        records = data.get('records', [])
        print(f"✅ Market API Response: {len(records)} records found")

        return {
            "success": True,
            "data": {
                "records": records,
                "total": data.get('total', len(records)),
                "count": len(records)
            },
            "error": None
        }
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching market data: {e}")
        error_message = f"Network or API error: {str(e)}"
        return {
            "success": False,
            "data": None,
            "error": error_message
        }
    except Exception as e:
        print(f"❌ Unexpected error during market data fetch: {e}")
        return {
            "success": False,
            "data": None,
            "error": f"An unexpected error occurred: {str(e)}"
        }

@app.route('/api/market-prices', methods=['GET'])
def get_market_prices():
    """API endpoint to get market prices based on query parameters."""
    filters = {
        "state": request.args.get("state"),
        "district": request.args.get("district"),
        "market": request.args.get("market"),
        "commodity": request.args.get("commodity"),
    }

    # Remove None values
    filters = {k: v for k, v in filters.items() if v}

    print(f"🔍 Market prices requested with filters: {filters}")

    result = fetch_market_data(filters)
    status_code = 500 if not result["success"] else 200

    return jsonify(result), status_code



# --- Gemini API Endpoint ---
@app.route('/api/gemini', methods=['POST'])
def gemini_chat():
    """API endpoint for Gemini chat, supports text and image input."""
    if not gemini_model:
         return jsonify({'error': 'Gemini model not initialized'}), 503 # Service Unavailable

    try:
        # Get form data
        prompt = request.form.get('prompt', 'No prompt provided')
        language = request.form.get('language', 'en')

        # Strict language enforcement (using a dictionary for clarity)
        language_instructions = {
            'hi': 'केवल हिंदी में जवाब दें। कोई अंग्रेजी शब्द नहीं। सिर्फ देवनागरी लिपि का उपयोग करें।',
            'ta': 'தமிழில் மட்டும் பதில் சொல்லுங்கள். ஆங்கிலம் கூடாது.',
            'te': 'తెలుగులో మాత్రమే సమాధానం ఇవ్వండి। ఇంగ్లీష్ వద్దు.',
            'bn': 'শুধু বাংলায় উত্তর দিন। ইংরেজি নয়।',
            'kn': 'ಕನ್ನಡದಲ್ಲಿ ಮಾತ್ರ ಉತ್ತರಿಸಿ। ಇಂಗ್ಲಿಷ್ ಬೇಡ.',
            'en': 'Answer ONLY in English language.'
            # Add more languages as needed
        }
        lang_instruction = language_instructions.get(language, language_instructions['en'])

        # Build the system prompt for Gemini
        # Adjusted for clarity and using f-string formatting safely
        system_prompt = f"""You are a professional Indian agricultural advisor. Be precise and concise.

CRITICAL: {lang_instruction}
Answer in 3-5 sentences maximum. Be direct and actionable.

Question: {prompt}"""

        # Prepare content parts for Gemini
        content_parts = [system_prompt]

        # Check if an image file is uploaded
        if 'file' in request.files:
            file = request.files['file']
            # Ensure file exists and has a name (basic validation)
            if file and file.filename:
                print(f"Received image file: {file.filename}, MIME type: {file.mimetype}")
                try:
                    image_bytes = file.read()
                    # Validate and convert image using PIL
                    image = Image.open(io.BytesIO(image_bytes))
                    # Append the validated image to content parts
                    # Gemini SDK generally prefers PIL Image objects directly for multimodal input
                    content_parts.append(image)
                except Exception as img_e:
                    print(f"❌ Error processing image: {img_e}")
                    # Optionally return an error if image processing fails
                    # return jsonify({'error': f'Invalid or corrupted image file: {img_e}'}), 400
                    # Or, proceed with text-only generation
                    print("⚠️ Proceeding with text-only generation due to image error.")


        # Generate content using Gemini
        print(f"Sending content to Gemini model ({len(content_parts)} parts)")
        response = gemini_model.generate_content(content_parts)

        # Check for safety ratings or blocked content if needed
        # print(response.prompt_feedback)

        return jsonify({'answer': response.text})

    except Exception as e:
        print(f"❌ Error in /api/gemini: {str(e)}")
        # Provide a more generic error message to the client for security
        return jsonify({'error': 'An internal error occurred while generating the response.'}), 500


# --- NEW/UPDATED Claims Endpoints ---

@app.route('/api/claims', methods=['POST'])
def file_new_claim():
    """Handles filing a new claim, storing proof on blockchain, and saving."""
    try:
        data = request.json
        # Basic validation
        required_fields = ['userId', 'crop', 'event', 'amount', 'description']
        if not data or not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required claim data"}), 400

        user_id = data['userId']
        crop = data['crop']
        event = data['event']
        amount = data['amount']
        description = data['description']

        # 1. Generate unique Claim ID
        claim_id = f"CLM{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:6]}"

        # 2. Prepare data for blockchain proof (e.g., hash the core claim details)
        #    Decide what constitutes the immutable proof. Let's hash key details + timestamp.
        proof_data = {
            "claimId": claim_id,
            "userId": user_id,
            "crop": crop,
            "event": event,
            "filedAt": datetime.now().isoformat() # Use ISO format timestamp
        }
        # Metadata can include things not hashed, or repeat some info
        metadata_string = f"ClaimID:{claim_id};UserID:{user_id};Event:{event}"

        # 3. Store proof on blockchain
        proof_tx_hash = store_proof_on_blockchain(proof_data, metadata_string)

        if not proof_tx_hash:
            # Handle failure to store proof (e.g., blockchain down, insufficient funds)
            # Decide if claim should still be saved with status 'Proof Pending' or fail entirely
            return jsonify({"error": "Failed to store claim proof on the blockchain"}), 500

        # 4. Create Claim Record (Simulated Save)
        new_claim = {
            "id": claim_id,
            "userId": user_id,
            "crop": crop,
            "event": event,
            "amount": amount,
            "description": description,
            "date": datetime.now().strftime('%Y-%m-%d'), # Use consistent date format
            "status": "submitted", # Initial status
            "progress": 10, # Example progress
            "proofTxHash": proof_tx_hash, # Store the transaction hash
            "hasProof": True # Indicate proof was submitted
        }

        # Simulate adding to DB
        if user_id not in SIMULATED_DB:
            SIMULATED_DB[user_id] = [] # Initialize if user is new
        SIMULATED_DB[user_id].append(new_claim)
        print(f"Simulated save for claim: {claim_id}")

        # 5. Return the created claim
        return jsonify({"success": True, "data": new_claim, "message": "Claim filed successfully"}), 201 # 201 Created

    except Exception as e:
        print(f"❌ Error in /api/claims [POST]: {str(e)}")
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500

@app.route('/api/claims/<string:user_id>', methods=['GET'])
def get_user_claims(user_id):
    """Retrieves all claims for a specific user."""
    print(f"Fetching claims for user: {user_id}")
    # Simulate fetching from DB
    user_claims = SIMULATED_DB.get(user_id, [])
    print(f"Found {len(user_claims)} claims for user {user_id}")

    # Return structure expected by apiCall and frontend
    # IMPORTANT: The frontend expects { success: true, data: { claims: [...] } }
    # Let's adjust the return format here to match exactly
    return jsonify({"success": True, "data": {"claims": user_claims}})


@app.route('/api/claims/<string:claim_id>/proof', methods=['GET'])
def get_claim_proof(claim_id):
    """Retrieves proof details (txHash) for a specific claim."""
    print(f"Fetching proof for claim: {claim_id}")
    # Simulate finding the claim across all users (inefficient, replace with DB query)
    found_claim = None
    for user_claims in SIMULATED_DB.values():
        for claim in user_claims:
            if claim.get('id') == claim_id:
                found_claim = claim
                break
        if found_claim:
            break

    if not found_claim:
        return jsonify({"success": False, "error": "Claim not found"}), 404

    proof_hash = found_claim.get('proofTxHash')

    if not proof_hash:
        return jsonify({"success": False, "error": "Proof transaction hash not found for this claim"}), 404

    # Optionally add blockchain confirmation check here
    stored_at_timestamp = None # Placeholder, would need to query contract if needed here too

    return jsonify({
        "success": True,
        "data": {
            "proofTxHash": proof_hash,
            "storedAt": stored_at_timestamp # Add timestamp if you fetch it
            # "metadata": Add metadata if you fetch it from contract/db
        }
    })


# --- Blockchain Interaction Endpoint (Updated for New Contract) ---
@app.route('/api/store-proof', methods=['POST'])
def store_proof_on_chain():
    """Stores a hash + metadata on Polygon Amoy using the onlyOwner contract."""
    if not proof_storage_contract or not w3 or not backend_account:
        return jsonify({"error": "Blockchain service not configured or unavailable"}), 503

    try:
        raw_data = request.json.get('data') # e.g., {"sensorId": "A1", "temp": 25.5, "humidity": 60}
        metadata_string = request.json.get('metadata', '') # e.g., "farmerId:FARMER123;timestamp:1678886400"

        if not raw_data:
            return jsonify({"error": "Missing 'data' field in request body"}), 400

        # --- Hashing ---
        data_string = json.dumps(raw_data, sort_keys=True)
        data_bytes = data_string.encode('utf-8')
        # Use keccak256 commonly used in Ethereum, or sha256. Ensure consistency.
        # Solidity's bytes32 often pairs well with keccak256
        # data_hash = Web3.keccak(data_bytes) # Option 1: Keccak256 (web3.py >v6)
        data_hash = hashlib.sha256(data_bytes).digest() # Option 2: SHA256 (bytes)

        print(f"Data to store: {data_string}")
        print(f"Calculated Hash (bytes): {data_hash.hex()}")

        # --- Prepare Metadata (as bytes) ---
        metadata_bytes = metadata_string.encode('utf-8')

        # --- Check if proof exists ---
        proof_exists = proof_storage_contract.functions.verifyProof(data_hash).call()
        if proof_exists:
            print(f"Proof hash {data_hash.hex()} already exists.")
            # Optionally retrieve existing metadata
            # existing_metadata = proof_storage_contract.functions.getMetadata(data_hash).call()
            # print(f"Existing metadata (bytes): {existing_metadata.hex()}")
            return jsonify({"message": "Proof already exists", "hash": data_hash.hex()}), 200

        # --- Build & Send Transaction ---
        print("Attempting to build transaction...")
        nonce = w3.eth.get_transaction_count(backend_account.address)

        # Estimate gas (more reliable)
        try:
            gas_estimate = proof_storage_contract.functions.storeProof(
                data_hash, metadata_bytes
            ).estimate_gas({'from': backend_account.address})
            print(f"Estimated Gas: {gas_estimate}")
            # Add a buffer to the estimate
            gas_limit = int(gas_estimate * 1.2)
        except Exception as estimate_e:
            print(f"⚠️ Gas estimation failed: {estimate_e}. Using default gas limit.")
            gas_limit = 300000 # Default fallback

        current_gas_price = w3.eth.gas_price
        print(f"Current Gas Price: {current_gas_price}")

        tx_params = {
            'chainId': AMOY_CHAIN_ID,
            'gas': gas_limit,
            'gasPrice': current_gas_price,
            'nonce': nonce,
            'from': backend_account.address # Crucial: Must match the owner for onlyOwner
        }

        # Build the transaction object
        store_proof_func = proof_storage_contract.functions.storeProof(data_hash, metadata_bytes)
        tx = store_proof_func.build_transaction(tx_params)

        print("Transaction built. Signing...")
        signed_tx = w3.eth.account.sign_transaction(tx, private_key=BACKEND_PRIVATE_KEY)

        print("Transaction signed. Sending...")
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        tx_hex = tx_hash.hex() # Get hex representation

        print(f"Transaction sent to Polygon Amoy. Tx Hash: {tx_hex}")

        # Respond immediately (202 Accepted)
        return jsonify({
            "message": "Proof transaction submitted to Polygon Amoy",
            "txHash": tx_hex,
            "dataHash": data_hash.hex()
        }), 202

    except Exception as e:
        # Catch potential errors like incorrect owner, insufficient funds, etc.
        error_message = str(e)
        print(f"❌ Error in /api/store-proof: {error_message}")
        # Check for common contract revert reasons (requires parsing the error)
        if 'revert' in error_message or 'execution reverted' in error_message:
            if "Not owner" in error_message: # Check if the specific error message is present
                return jsonify({'error': 'Transaction failed: Backend wallet is not the contract owner.'}), 403 # Forbidden
            else:
                return jsonify({'error': f'Transaction reverted: {error_message}'}), 400 # Bad Request (likely bad input or state)
        elif 'insufficient funds' in error_message:
            return jsonify({'error': 'Transaction failed: Backend wallet has insufficient MATIC for gas.'}), 500 # Internal Server Error
        else:
            return jsonify({'error': f'An internal error occurred: {error_message}'}), 500


# --- Basic Health Check Route ---
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Backend running!"})

# --- Run the Flask App ---
if __name__ == '__main__':
    # Get port from environment or default to 5000
    port = int(os.getenv('PORT', 5000))
    # Set debug=False for production deployment
    app.run(debug=True, host='0.0.0.0', port=port)