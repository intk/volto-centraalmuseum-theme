from datetime import datetime
from plone.app.dexterity.textindexer.directives import searchable
from plone.app.event import _
from plone.app.event.base import default_end as default_end_dt
from plone.app.event.base import default_start as default_start_dt
from plone.app.event.base import default_timezone
from plone.app.textfield import RichText
from plone.app.z3cform.widget import DatetimeFieldWidget
from plone.app.z3cform.widget import RelatedItemsFieldWidget
from plone.autoform import directives
from plone.autoform import directives as form_directives
from plone.dexterity.content import Container
from plone.supermodel import model
from z3c.form.browser.checkbox import SingleCheckBoxFieldWidget
from z3c.relationfield.schema import RelationChoice
from z3c.relationfield.schema import RelationList
from zope import schema
from zope.interface import implementer
from zope.interface import provider
from zope.schema import Bool
from zope.schema import Datetime
from zope.schema import List
from zope.schema import Text
from zope.schema import TextLine
from zope.schema.interfaces import IContextAwareDefaultFactory



class IBlogwriter(model.Schema):
    """Schema for Exhibition content type."""

    # title = TextLine(
    #     title="Title",
    #     required=False,
    # )



    # searchable(
    #     "priref",
    #     "cm_nummer",
    #     "objects",
    # )
