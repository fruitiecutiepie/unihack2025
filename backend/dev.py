import subprocess
import os
import json
from pyngrok import ngrok

# Path to the JSON config file
CONFIG_FILE_PATH = os.path.join("..", "frontend", "config.json")

def start_ngrok_tunnel(port: int) -> str:
    # Configure the tunnel with proper settings
    tunnel = ngrok.connect(
        port,
        "http",
        bind_tls=True,
        host_header="rewrite",
        inspect=False
    )
    
    public_url = tunnel.public_url
    print("Inspection disabled and host header rewriting enabled")
    return public_url

def update_frontend_global_variable(
    frontend_public_url: str,
    backend_public_url: str,
    file_path: str = CONFIG_FILE_PATH
) -> None:
    # Read existing JSON config or create new one if it doesn't exist
    try:
        with open(file_path, "r") as file:
            config = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        config = {}
    
    config["FRONTEND_URL"] = frontend_public_url
    config["BACKEND_URL"] = backend_public_url
    
    # Write the updated JSON back to the file
    with open(file_path, "w") as file:
        json.dump(config, file, indent=2)
    
    print(f"Updated BACKEND_URL in {file_path} with value: {backend_public_url}")

def start_backend():
    # Launch your backend process
    backend_process = subprocess.Popen(["python", "main.py"])
    return backend_process

if __name__ == "__main__":
    # 1. Start the ngrok tunnel.
    frontend_public_url = start_ngrok_tunnel(3000)
    print(f"Ngrok tunnel for frontend started at: {frontend_public_url}")
    
    backend_public_url = start_ngrok_tunnel(5033)
    print(f"Ngrok tunnel for backend started at: {backend_public_url}")
    
    # 2. Update the frontend global variable in the JSON file.
    update_frontend_global_variable(frontend_public_url, backend_public_url)
    
    # 3. Start your backend server.
    backend_proc = start_backend()

    try:
        # Wait until the backend process exits.
        backend_proc.wait()
    except KeyboardInterrupt:
        print("Stopping backend and closing ngrok tunnel...")
    finally:
        backend_proc.terminate()
        ngrok.kill()
