# CSV Analyzer Dashboard

A responsive and elegant dashboard for analyzing CSV data with keyword metrics. This application allows users to upload CSV files containing keyword data, visualize the data with interactive charts, and filter/sort the results.

## Features

- **File Upload**: Upload CSV files with keyword data
- **Data Visualization**: Interactive charts showing keyword metrics
- **Sorting & Filtering**: Dynamic sorting and filtering of data
- **Responsive Design**: Works on desktop and mobile devices

## CSV Format

The application expects CSV files with the following columns:
- keyword
- search intent
- search volume
- keyword difficulty
- cpc (Cost Per Click)

## Running on Replit

### Setup

1. Create a new Replit project
2. Choose "Python" as the language
3. Upload all the project files or clone from GitHub
4. Make sure your Replit project has the following structure:
   ```
   ├── app.py
   ├── index.html
   ├── static/
   │   ├── css/
   │   │   └── styles.css
   │   └── js/
   │       └── script.js
   ├── templates/
   │   └── index.html (move index.html here)
   └── uploads/ (will be created automatically)
   ```

5. Add the following packages to your `pyproject.toml` or install them:
   ```
   flask
   pandas
   ```

### Running the Application

1. Click the "Run" button in Replit
2. The application should start and be available at the URL provided by Replit
3. Upload a CSV file with the required format to analyze your keyword data

## Local Development

To run the application locally:

1. Make sure you have Python installed
2. Install the required packages:
   ```
   pip install flask pandas
   ```
3. Run the application:
   ```
   python app.py
   ```
4. Open your browser and navigate to `http://localhost:8080`

## Sample CSV Data

Here's an example of how your CSV data should be formatted:

```
keyword,search intent,search volume,keyword difficulty,cpc
data visualization,informational,5400,45,2.50
data analysis tools,commercial,3200,38,3.75
data science courses,transactional,8900,52,4.20
data analytics dashboard,commercial,2100,35,3.10
data mining techniques,informational,4300,42,1.95
```

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Chart.js
- **Backend**: Python, Flask
- **Data Processing**: Pandas

## License

MIT