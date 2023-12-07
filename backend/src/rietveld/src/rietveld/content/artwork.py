from plone.app.textfield import RichText
from plone.dexterity.content import Container
from plone.supermodel import model
from zope.interface import implementer
from zope.schema import List
from zope.schema import Text
from zope.schema import TextLine


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

    objectExplanation = RichText(
        title="Explanation",
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

    materialTechnique = List(
        title="Material Technique",
        value_type=TextLine(),
        required=False,
    )

    inventoryNumber = TextLine(
        title="Inventory Number",
        required=False,
    )

    objectName = List(
        title="Object Name",
        value_type=TextLine(),
        required=False,
    )

    acquisition = TextLine(
        title="Acquisition",
        required=False,
    )

    inscriptions = List(
        title="Inscriptions",
        value_type=TextLine(),
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

    category = List(
        title="Category",
        value_type=TextLine(),
        required=False,
    )

    PIDworkLink = Text(
        title="PID Work Link",
        required=False,
    )

    creator = List(
        title="Creator",
        value_type=TextLine(),
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