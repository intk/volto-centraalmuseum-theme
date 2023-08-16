from plone import schema
# from plone.app.textfield import RichText
# from plone.autoform import directives
from plone.dexterity.content import Container
from plone.namedfile.field import NamedBlobImage
# from plone.schema.email import Email
from plone.supermodel import model
# from z3c.form.browser.checkbox import CheckBoxFieldWidget
# from z3c.form.browser.radio import RadioFieldWidget
from zope.interface import implementer
from zope.schema import Text
# from zope.schema.vocabulary import SimpleTerm
# from zope.schema.vocabulary import SimpleVocabulary


class IObject(model.Schema):
    """Dexterity-Schema for Objects"""

    preview = NamedBlobImage(
        title="Preview",
        description="Insert an image that will be used in listing and teaser blocks.",
        required=False,
    )
    preview_caption = schema.TextLine(
        title="Preview image caption",
        description="",
        required=False,
    )
    rawdata = Text(
        title="Rawdata",
        description="",
        required=False,
    )


@implementer(IObject)
class Object(Container):
    """Talk instance class"""
