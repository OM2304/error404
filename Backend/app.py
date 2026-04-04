from flask import Flask, jsonify
from flask_cors import CORS
import json
from clash_engine import detect_clashes

app = Flask(__name__)
CORS(app)

@app.route("/clashes")
def get_clashes():
    with open("sample.json") as f:
        elements = json.load(f)

    clashes = detect_clashes(elements)
    return jsonify(clashes)

@app.route("/ask")
def ask():
    return jsonify({"response": "System detected clashes successfully."})

if __name__ == "__main__":
    app.run(debug=True)