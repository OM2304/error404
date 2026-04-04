def is_clash(a, b):
    return (
        a["max"]["x"] > b["min"]["x"] and
        a["min"]["x"] < b["max"]["x"] and
        a["max"]["y"] > b["min"]["y"] and
        a["min"]["y"] < b["max"]["y"] and
        a["max"]["z"] > b["min"]["z"] and
        a["min"]["z"] < b["max"]["z"]
    )

def get_center(box):
    return {
        "x": (box["min"]["x"] + box["max"]["x"]) / 2,
        "y": (box["min"]["y"] + box["max"]["y"]) / 2,
        "z": (box["min"]["z"] + box["max"]["z"]) / 2
    }

def detect_clashes(elements):
    clashes = []

    for i in range(len(elements)):
        for j in range(i+1, len(elements)):
            a = elements[i]
            b = elements[j]

            if is_clash(a["bounding_box"], b["bounding_box"]):
                center = get_center(a["bounding_box"])

                clashes.append({
                    "id": len(clashes) + 1,
                    "type": f"{a['type']} - {b['type']}",
                    "A": a,
                    "B": b,
                    "location": center,
                    "status": "Hard Clash"
                })

    return clashes