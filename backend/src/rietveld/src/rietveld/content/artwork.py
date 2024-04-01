from datetime import datetime
from plone.app.dexterity.textindexer.directives import searchable
from plone.app.textfield import RichText
from plone.app.z3cform.widget import RelatedItemsFieldWidget
from plone.autoform import directives as form_directives
from plone.dexterity.content import Container
from plone.supermodel import model
from z3c.relationfield.schema import RelationChoice
from z3c.relationfield.schema import RelationList
from zope.interface import implementer
from zope.schema import Bool
from zope.schema import Datetime
from zope.schema import List
from zope.schema import Text
from zope.schema import TextLine
from zope.schema import Tuple


class IArtwork(model.Schema):
    """Schema for Artwork content type."""

    title = TextLine(
        title="Title",
        required=False,
    )

    priref = TextLine(title="Priref", required=False)

    description = Text(
        title="Description",
        required=False,
    )

    objectExplanation = RichText(
        title="Explanation",
        required=False,
    )

    ObjOnDisplay = Bool(title="Object On Display", required=False, default=False)

    displayLocation = TextLine(
        title="Display Location",
        required=False,
    )

    physicaldescription = TextLine(
        title="Physical Description",
        required=False,
    )

    dating = TextLine(
        title="Dating",
        required=False,
    )

    productionStart = TextLine(
        title="Production Start Date",
        required=False,
    )

    productionEnd = TextLine(
        title="Production End Date",
        required=False,
    )

    acquisitionMethod = TextLine(
        title="Acquisition Method",
        required=False,
    )
    acquisitionDate = TextLine(
        title="Acquisition Date",
        required=False,
    )

    exhibitionTitles = List(
        title="Exhibition Titles",
        value_type=TextLine(),
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
        title="Object Type",
        value_type=TextLine(),
        required=False,
    )

    collection = List(
        title="Collection type",
        value_type=TextLine(),
        required=False,
    )

    associatedPeriods = List(
        title="Associated Periods",
        value_type=TextLine(),
        required=False,
    )

    associatedPeople = List(
        title="Associated People",
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

    motifs = List(
        title="Motifs",
        value_type=TextLine(),
        required=False,
    )

    remarks = List(
        title="Remarks",
        value_type=TextLine(),
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

    exhibitions_list = List(
        title="Exhibitions List",
        description="List of exhibitions that artwork appears",
        value_type=Tuple(
            title="Exhibition details",
            value_type=TextLine(),
        ),
        required=False,
        default=[],
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

    associatedSubjects = List(
        title="Associated Subjects",
        value_type=TextLine(),
        required=False,
    )

    PIDworkLink = Text(
        title="PID Work Link",
        required=False,
    )

    creator = RichText(
        title="Creator",
        required=False,
    )

    authors = RelationList(
        title="Authors",
        default=[],
        value_type=RelationChoice(
            title="Author", vocabulary="plone.app.vocabularies.Catalog"
        ),
        required=False,
    )
    authorRoles = List(
        title="Author roles",
        value_type=TextLine(),
        required=False,
    )
    authorQualifiers = List(
        title="Author Qualifiers",
        value_type=TextLine(),
        required=False,
    )
    authorPlaces = List(
        title="Author Place",
        value_type=TextLine(),
        required=False,
    )
    form_directives.widget(
        "authors",
        RelatedItemsFieldWidget,
        pattern_options={
            "selectableTypes": [
                "author",
            ],
        },
    )

    last_successful_update = Datetime(
        title="Last Successful Update",
        description="",
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

    searchable(
        remarks,
        priref,
        dating,
        authors,
    )
