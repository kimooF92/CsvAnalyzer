# CSV Analyzer Dashboard - Flask Backend
import os
import pandas as pd
from flask import Flask, request, jsonify, render_template, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Configuration
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'csv'}

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Serve static files
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Main route
@app.route('/')
def index():
    return render_template('index.html')

# File upload route
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the CSV file
        try:
            data = process_csv(filepath)
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file type'}), 400

# Process CSV function
def process_csv(filepath):
    # Read CSV file
    df = pd.read_csv(filepath)
    
    # Ensure required columns exist
    required_columns = ['keyword', 'search intent', 'search volume', 'keyword difficulty', 'cpc']
    
    # Check column names (case insensitive)
    df.columns = [col.lower().strip() for col in df.columns]
    
    # Map column names to expected format
    column_mapping = {
        'keyword': 'keyword',
        'search intent': 'search_intent',
        'search volume': 'search_volume',
        'keyword difficulty': 'keyword_difficulty',
        'cpc': 'cpc'
    }
    
    # Rename columns
    for old_col, new_col in column_mapping.items():
        if old_col in df.columns:
            df = df.rename(columns={old_col: new_col})
    
    # Convert numeric columns
    try:
        df['search_volume'] = pd.to_numeric(df['search_volume'], errors='coerce')
        df['keyword_difficulty'] = pd.to_numeric(df['keyword_difficulty'], errors='coerce')
        df['cpc'] = pd.to_numeric(df['cpc'], errors='coerce')
        
        # Fill NaN values
        df = df.fillna({'search_volume': 0, 'keyword_difficulty': 0, 'cpc': 0})
    except KeyError as e:
        raise Exception(f"Missing required column: {e}")
    
    # Convert to list of dictionaries for JSON response
    data = df.to_dict(orient='records')
    
    return data

# Serve the HTML file for any route
@app.route('/<path:path>')
def catch_all(path):
    return render_template('index.html')

# Run the application
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)