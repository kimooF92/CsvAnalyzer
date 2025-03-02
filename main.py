
# This file is the entry point for the application
# It imports and runs the Flask app from csv analyzer/app.py

import os
import sys

# Add the project root directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the Flask app
from csv_analyzer.app import app

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8080, debug=True)
