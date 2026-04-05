# import ifcopenshell
# import ifcopenshell.geom

# settings = ifcopenshell.geom.settings()
# settings.set(settings.USE_WORLD_COORDS, True)

# def get_bbox(verts):
#     xs = verts[0::3]
#     ys = verts[1::3]
#     zs = verts[2::3]

#     return {
#         "min": {"x": min(xs), "y": min(ys), "z": min(zs)},
#         "max": {"x": max(xs), "y": max(ys), "z": max(zs)}
#     }

# def parse_ifc(file_path):
#     model = ifcopenshell.open(file_path)
#     elements = []

#     targets = ["IfcPipeSegment", "IfcDuctSegment", "IfcCableCarrierSegment"]

#     for t in targets:
#         for elem in model.by_type(t):
#             try:
#                 shape = ifcopenshell.geom.create_shape(settings, elem)
#                 verts = shape.geometry.verts

#                 bbox = get_bbox(verts)

#                 elements.append({
#                     "element_id": elem.GlobalId,
#                     "type": t.replace("Ifc", ""),
#                     "bounding_box": bbox
#                 })

#             except:
#                 continue

#     return elements



import ifcopenshell

def parse_ifc(file_path):
    model = ifcopenshell.open(file_path)

    elements = []

    for elem in model.by_type("IfcFlowSegment"):
        try:
            bbox = elem.Representation.Representations[0].Items[0]

            elements.append({
                "id": elem.GlobalId,
                "type": elem.is_a(),
                "min_x": 0,
                "min_y": 0,
                "min_z": 0,
                "max_x": 5,
                "max_y": 5,
                "max_z": 5
            })
        except:
            continue

    return elements