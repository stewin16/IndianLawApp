import csv
import json

def convert():
    csv_file = 'datasets resources/bns_sections.csv'
    json_file = 'public/bns_data.json'
    
    data = []
    try:
        with open(csv_file, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Basic cleanup
                cleaned_row = {k.strip(): v.strip() for k, v in row.items() if k and v}
                data.append(cleaned_row)
                
        with open(json_file, mode='w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        print(f"Successfully converted {len(data)} BNS sections to {json_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    convert()
