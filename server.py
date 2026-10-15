"""Serve the static prototype locally. All corpus processing stays in the browser."""
from pathlib import Path
from flask import Flask, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=None)

@app.get('/')
def index():
    return send_from_directory(ROOT, 'index.html')

@app.get('/<path:name>')
def static_file(name):
    return send_from_directory(ROOT, name)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
