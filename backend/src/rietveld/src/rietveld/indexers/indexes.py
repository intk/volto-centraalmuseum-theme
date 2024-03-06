from plone.indexer.decorator import indexer
from rietveld.content.artwork import IArtwork


# @indexer(IArtwork)
# def object_remarks(obj):
#     remarks = getattr(obj, "remarks", [])
#     remark_index = []
#     for remark in remarks:
#         remark_index.append(remark)
#     return remark_index


@indexer(IArtwork)
def artwork_author(obj):
    relations = getattr(obj, "authors", [])
    titles = []
    for relation in relations:
        if relation.isBroken():
            continue  # Skip broken relations
        target_object = relation.to_object
        title = target_object.Title().strip()  # Strip leading and trailing spaces
        titles.append(title)
    return titles


@indexer(IArtwork)
def artwork_author_role(obj):
    types = getattr(obj, "authorRoles", None)

    # If it's a string, split by comma and strip each type of surrounding whitespace
    if isinstance(types, str):
        types_list = [
            material.strip() for material in types.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the techniques
    elif hasattr(types, "__iter__") and not isinstance(types, str):
        types_list = [material.strip() for material in types if material.strip()]
    # If it's None or empty string, return an empty list
    else:
        types_list = []

    return types_list


@indexer(IArtwork)
def artwork_author_place(obj):
    types = getattr(obj, "authorPlaces", None)

    # If it's a string, split by comma and strip each type of surrounding whitespace
    if isinstance(types, str):
        types_list = [
            material.strip() for material in types.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the techniques
    elif hasattr(types, "__iter__") and not isinstance(types, str):
        types_list = [material.strip() for material in types if material.strip()]
    # If it's None or empty string, return an empty list
    else:
        types_list = []

    return types_list


@indexer(IArtwork)
def artwork_motif(obj):
    types = getattr(obj, "motifs", None)

    # If it's a string, split by comma and strip each type of surrounding whitespace
    if isinstance(types, str):
        types_list = [
            material.strip() for material in types.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the techniques
    elif hasattr(types, "__iter__") and not isinstance(types, str):
        types_list = [material.strip() for material in types if material.strip()]
    # If it's None or empty string, return an empty list
    else:
        types_list = []

    return types_list


@indexer(IArtwork)
def artwork_author_qualifier(obj):
    types = getattr(obj, "authorQualifiers", None)

    # If it's a string, split by comma and strip each type of surrounding whitespace
    if isinstance(types, str):
        types_list = [
            material.strip() for material in types.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the techniques
    elif hasattr(types, "__iter__") and not isinstance(types, str):
        types_list = [material.strip() for material in types if material.strip()]
    # If it's None or empty string, return an empty list
    else:
        types_list = []

    return types_list


@indexer(IArtwork)
def artwork_author_vocab(obj):
    relations = getattr(obj, "authors", [])
    titles = []
    for relation in relations:
        if relation.isBroken():
            continue  # Skip broken relations
        target_object = relation.to_object
        title = target_object.Title().strip()  # Strip leading and trailing spaces
        titles.append(title)
    return titles


@indexer(IArtwork)
def artwork_material(obj):
    # Retrieve the ObjMaterialTxt attribute, which could be None, a single material, or multiple materials
    materials = getattr(obj, "materialTechnique", None)

    # If it's a string, split by comma and strip each material of surrounding whitespace
    if isinstance(materials, str):
        materials_list = [
            material.strip() for material in materials.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the materials
    elif hasattr(materials, "__iter__") and not isinstance(materials, str):
        materials_list = [
            material.strip() for material in materials if material.strip()
        ]
    # If it's None or empty string, return an empty list
    else:
        materials_list = []

    return materials_list


@indexer(IArtwork)
def artwork_type(obj):
    # Retrieve the ObjMaterialTxt attribute, which could be None, a single material, or multiple materials
    materials = getattr(obj, "objectName", None)

    # If it's a string, split by comma and strip each material of surrounding whitespace
    if isinstance(materials, str):
        materials_list = [
            material.strip() for material in materials.split(",") if material.strip()
        ]
    # If it's already a list or a tuple (or any iterable but string), just strip the materials
    elif hasattr(materials, "__iter__") and not isinstance(materials, str):
        materials_list = [
            material.strip() for material in materials if material.strip()
        ]
    # If it's None or empty string, return an empty list
    else:
        materials_list = []

    return materials_list


@indexer(IArtwork)
def artwork_date(obj):
    return obj.dating
