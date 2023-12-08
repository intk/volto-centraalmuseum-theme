from plone.indexer.decorator import indexer
from rietveld.content.artwork import IArtwork


@indexer(IArtwork)
def object_remarks(obj):
    remarks = getattr(obj, "remarks", [])
    remark_index = []
    for remark in remarks:
        remark_index.append(remark)
    return remark_index
