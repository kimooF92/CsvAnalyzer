from flask import Flask, render_template, request, jsonify
import pandas as pd
import os
import json

app = Flask(__name__, static_url_path='/static', template_folder='templates')
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create uploads folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and file.filename.endswith('.csv'):
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'uploaded_data.csv')
        file.save(filepath)

        try:
            data = process_csv(filepath)
            return jsonify(data)
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    else:
        return jsonify({'error': 'Only CSV files are allowed'}), 400

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)