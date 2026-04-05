import ifcopenshell
import ifcopenshell.geom

settings = ifcopenshell.geom.settings()
settings.set(settings.USE_WORLD_COORDS, True)

def get_bbox(verts):
    xs = verts[0::3]
    ys = verts[1::3]
    zs = verts[2::3]

    return {
        "min": {"x": min(xs), "y": min(ys), "z": min(zs)},
        "max": {"x": max(xs), "y": max(ys), "z": max(zs)}
    }

def parse_ifc(file_path):
    model = ifcopenshell.open(file_path)
    elements = []

    targets = ["IfcPipeSegment", "IfcDuctSegment", "IfcCableCarrierSegment"]

    for t in targets:
        for elem in model.by_type(t):
            try:
                shape = ifcopenshell.geom.create_shape(settings, elem)
                verts = shape.geometry.verts

                bbox = get_bbox(verts)

                elements.append({
                    "id": elem.GlobalId,
                    "type": t.replace("Ifc", ""),
                    "min_x": bbox["min"]["x"],
                    "min_y": bbox["min"]["y"],
                    "min_z": bbox["min"]["z"],
                    "max_x": bbox["max"]["x"],
                    "max_y": bbox["max"]["y"],
                    "max_z": bbox["max"]["z"]
                })

            except:
                continue

    return elements
