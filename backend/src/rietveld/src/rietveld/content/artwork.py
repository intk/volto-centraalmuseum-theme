from plone.dexterity.content import Container
from plone.supermodel import model
from zope.interface import implementer
from zope.schema import Text, TextLine, List

class IArtwork(model.Schema):
    """Schema for Artwork content type."""

    title = TextLine(
        title="Title",
        required=False,
    )

    description = Text(
        title="Description",
        required=False,
    )

    displayLocation = TextLine(
        title="Display Location",
        required=False,
    )

    dating = TextLine(
        title="Dating",
        required=False,
    )

    materialTechnique = TextLine(
        title="Material Technique",
        required=False,
    )

    inventoryNumber = TextLine(
        title="Inventory Number",
        required=False,
    )

    objectName = TextLine(
        title="Object Name",
        required=False,
    )

    acquisition = TextLine(
        title="Acquisition",
        required=False,
    )

    inscriptions = Text(
        title="Inscriptions",
        required=False,
    )

    motifs = Text(
        title="Motifs",
        required=False,
    )

    remarks = Text(
        title="Remarks",
        required=False,
    )

    dimensions = List(
        title="Dimensions",
        value_type=TextLine(),
        required=False,
    )

    exhibitions = List(
        title="Exhibitions",
        value_type=TextLine(),
        required=False,
    )

    documentation = List(
        title="Documentation",
        value_type=TextLine(),
        required=False,
    )

    PIDworkLink = TextLine(
        title="PID Work Link",
        required=False,
    )

    creator = TextLine(
        title="Creator",
        required=False,
    )

    creatorDetails = Text(
        title="Creator Details",
        required=False,
    )

    rawdata = Text(
        title="Rawdata",
        description="",
        required=False,
    )


@implementer(IArtwork)
class Artwork(Container):
    """Artwork instance class"""
