from plone import schema
from plone.dexterity.content import Container
from plone.namedfile.field import NamedBlobImage
from plone.supermodel import model
from zope.interface import implementer
from zope.schema import Text


class IObject(model.Schema):
    """Dexterity-Schema for Objects"""

    rawdata = Text(
        title="Rawdata",
        description="",
        required=False,
    )


@implementer(IObject)
class Object(Container):
    """Talk instance class"""
