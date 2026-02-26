import urllib.request
import json

url = "https://script.google.com/macros/s/AKfycbylIUZ_w4yDTzagZB2drnJDW9wbdM84R6fO_3vz0GPMKuscPbBoNJUlYEgu4AnsFZpqCg/exec"

data = {
    "type": "Baseline",
    "data": {
        "Ambulatório": "Teste Amb",
        "Data da avaliação": "2026-02-22",
        "ID prontuário": "999888"
    }
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'text/plain;charset=utf-8'})
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode('utf-8'))
