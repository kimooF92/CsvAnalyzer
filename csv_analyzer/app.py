import utils.session
from flask import Flask, render_template, request, jsonify, send_file
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
    try:
        # Read CSV file with more flexible options
        df = pd.read_csv(filepath, skipinitialspace=True, on_bad_lines='warn')

        if df.empty or len(df.columns) == 0:
            raise Exception("No columns to parse from file. The CSV file appears to be empty or malformed.")

        # If we have only one column, the CSV might be using a different delimiter
        if len(df.columns) == 1:
            # Try with other common delimiters
            for delimiter in [';', '\t', '|']:
                try:
                    df = pd.read_csv(filepath, sep=delimiter, skipinitialspace=True)
                    if len(df.columns) > 1:
                        print(f"Successfully parsed CSV with delimiter: {delimiter}")
                        break
                except:
                    continue

        # If still only one column, it might be a malformed CSV
        if len(df.columns) == 1:
            first_col = df.columns[0]
            # Check if the column name itself contains the entire header row
            if ',' in first_col:
                # Try to parse the column names from the first row
                header_row = first_col.split(',')
                data_rows = [row.split(',') for row in df[first_col].astype(str)]
                df = pd.DataFrame(data_rows, columns=header_row)

        # Ensure required columns exist
        required_columns = ['keyword', 'search intent', 'search volume', 'keyword difficulty', 'cpc']

        # Print raw columns to see what we have
        print("Raw CSV columns:", df.columns.tolist())

        # Clean up column names (case insensitive, remove extra spaces and quotes)
        df.columns = [col.lower().strip().strip('"').strip() for col in df.columns]

        # Print columns after basic cleaning
        print("CSV columns after basic cleaning:", df.columns.tolist())

        # Map column names to expected format with more flexible matching
        column_mapping = {}

        # Create a mapping with more flexible matching
        for col in df.columns:
            col_clean = col.strip().lower()

            if 'keyword' == col_clean or ('keyword' in col_clean and 
                                          all(x not in col_clean for x in ['intent', 'volume', 'difficulty'])):
                column_mapping[col] = 'keyword'
            elif any(x in col_clean for x in ['intent', 'search intent']):
                column_mapping[col] = 'search_intent'
            elif any(x in col_clean for x in ['volume', 'search volume']):
                column_mapping[col] = 'search_volume'
            elif any(x in col_clean for x in ['difficult', 'keyword difficult']):
                column_mapping[col] = 'keyword_difficulty'
            elif any(x in col_clean for x in ['cpc', 'cost', 'price']):
                column_mapping[col] = 'cpc'

        print("Column mapping:", column_mapping)

        # Rename columns
        df = df.rename(columns=column_mapping)

        # Ensure all required columns exist after mapping
        needed_columns = ['keyword', 'search_intent', 'search_volume', 'keyword_difficulty', 'cpc']
        missing = [col for col in needed_columns if col not in df.columns]

        if missing:
            print(f"Missing columns after mapping: {missing}")
            print("Available columns:", df.columns.tolist())
            raise Exception(f"Missing required column(s): {', '.join(missing)}")

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
    except pd.errors.EmptyDataError:
        raise Exception("The CSV file is empty.")
    except pd.errors.ParserError as e:
        raise Exception(f"Error parsing CSV file: {e}")
    except Exception as e:
        raise e


@app.route('/download-template')
def download_template():
    """Provide a template CSV file for download"""
    template_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'template.csv')
    return send_file(template_file, as_attachment=True, download_name='keyword_template.csv')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)