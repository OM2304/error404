def is_clash(a, b):
    return (
        a["min_x"] <= b["max_x"] and a["max_x"] >= b["min_x"] and
        a["min_y"] <= b["max_y"] and a["max_y"] >= b["min_y"] and
        a["min_z"] <= b["max_z"] and a["max_z"] >= b["min_z"]
    )

def detect_clashes(elements):
    clashes = []

    for i in range(len(elements)):
        for j in range(i+1, len(elements)):
            if is_clash(elements[i], elements[j]):
                clashes.append({
                    "id": f"{i}-{j}",
                    "a": elements[i]["id"],
                    "b": elements[j]["id"],
                    "type": "hard",
                    "location": [0,0,0]
                })

    return clashes
