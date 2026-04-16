import os
import json
import pandas as pd

def setup_kaggle_credentials(username, key):
    kaggle_dir = os.path.expanduser('~/.kaggle')
    if not os.path.exists(kaggle_dir):
        os.makedirs(kaggle_dir)
    
    with open(os.path.join(kaggle_dir, 'kaggle.json'), 'w') as f:
        json.dump({"username": username, "key": key}, f)
    
    # Set permissions (Windows doesn't support 600 in the same way, but we'll try)
    if os.name != 'nt':
        os.chmod(os.path.join(kaggle_dir, 'kaggle.json'), 0o600)

def download_data():
    dataset = "ziya07/stadium-crowd-dynamics-and-seat-optimization-dataset"
    kaggle_exe = r'C:\Users\ANKIT\AppData\Roaming\Python\Python314\Scripts\kaggle.exe'
    os.system(f'"{kaggle_exe}" datasets download -d {dataset} --unzip -p ./data')

def process_data_for_app():
    # Load movement data
    movement_path = './data/movement_edges.csv'
    if not os.path.exists(movement_path):
        print("Data not found. Did the download fail?")
        return

    df = pd.read_csv(movement_path)
    
    # Calculate historical averages based on available columns
    # We'll treat Source_Seat as the location ID for mapping
    # And derive a Wait Time proxy from Flow statistics
    # WaitTime Approximation = (Current_Flow / Flow_Capacity) * constant
    
    df['calculated_wait'] = (df['Current_Flow'] / df['Flow_Capacity']) * 20 # Max 20 min wait

    historical_patterns = df.groupby(['Source_Seat']).agg({
        'calculated_wait': 'mean',
        'Current_Flow': 'mean',
        'Congestion_Level': 'mean'
    }).reset_index()

    # Save to a JSON format our React app can easily consume
    result = []
    # Map the first 4 seats in the data to our 4 stands
    stands = ["stand_1", "stand_2", "stand_3", "stand_4"]
    for i, row in historical_patterns.iterrows():
        if i >= len(stands): break
        
        result.append({
            "location_id": stands[i],
            "time_segment": "Weekday", # Simplified for now
            "avg_wait": round(row['calculated_wait'], 2),
            "avg_density": round(row['Congestion_Level'] * 100, 2)
        })

    with open('./src/services/historical_data.json', 'w') as f:
        json.dump(result, f, indent=2)
    
    print("Successfully processed Kaggle data into src/services/historical_data.json")

if __name__ == "__main__":
    # Your credentials
    USERNAME = "ankitrajchoudhari"
    KEY = "KGAT_ddd7ec7ab300fbd953e7ae95ce62d070"
    
    print("Setting up Kaggle credentials...")
    setup_kaggle_credentials(USERNAME, KEY)
    
    print("Downloading dataset...")
    download_data()
    
    print("Processing data...")
    process_data_for_app()
