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
