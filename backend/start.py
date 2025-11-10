"""
Quick Start Script for FastAPI Server
Checks dependencies and starts the server
"""

import subprocess
import sys
import os
from pathlib import Path


def check_python_version():
    """Check if Python version is 3.8+"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required!")
        print(f"Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")


def check_virtual_env():
    """Check if running in virtual environment"""
    in_venv = hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )
    if not in_venv:
        print("⚠️  Warning: Not running in a virtual environment")
        print("   It's recommended to use a virtual environment")
        print("   Run: python -m venv venv")
        print("        .\\venv\\Scripts\\Activate.ps1")
    else:
        print("✅ Virtual environment active")


def check_env_file():
    """Check if .env file exists"""
    if not Path(".env").exists():
        print("⚠️  Warning: .env file not found")
        print("   Copying .env.example to .env...")
        if Path(".env.example").exists():
            with open(".env.example", "r") as src:
                with open(".env", "w") as dst:
                    dst.write(src.read())
            print("✅ Created .env file from .env.example")
            print("   Please update .env with your configuration!")
        else:
            print("❌ .env.example not found!")
            sys.exit(1)
    else:
        print("✅ .env file exists")


def install_dependencies():
    """Install required dependencies"""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies")
        sys.exit(1)


def start_server():
    """Start the FastAPI server"""
    print("\n🚀 Starting FastAPI server...")
    print("📚 API Documentation: http://localhost:5000/api/docs")
    print("🏥 Health Check: http://localhost:5000/api/health")
    print("\nPress Ctrl+C to stop the server\n")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "5000"
        ])
    except KeyboardInterrupt:
        print("\n👋 Server stopped")


def main():
    """Main function"""
    print("=" * 50)
    print("🎯 Restmage FastAPI Server - Quick Start")
    print("=" * 50)
    
    # Run checks
    check_python_version()
    check_virtual_env()
    check_env_file()
    
    # Ask to install dependencies
    install = input("\n📦 Install/update dependencies? (y/n): ")
    if install.lower() == 'y':
        install_dependencies()
    
    # Start server
    start = input("\n🚀 Start server? (y/n): ")
    if start.lower() == 'y':
        start_server()
    else:
        print("\n✅ Setup complete!")
        print("To start the server manually, run:")
        print("   uvicorn main:app --reload")


if __name__ == "__main__":
    main()
