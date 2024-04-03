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


@provider(IContextAwareDefaultFactory)
def default_start(context):
    """Provide default start for the form."""
    return default_start_dt(context)


@provider(IContextAwareDefaultFactory)
def default_end(context):
    """Provide default end for the form."""
    return default_end_dt(context)


class IExhibition(model.Schema):
    """Schema for Exhibition content type."""

    title = TextLine(
        title="Title",
        required=False,
    )

    start = schema.Datetime(
        title=_("label_event_start", default="Event Starts"),
        description=_(
            "help_event_start", default="Date and Time, when the event begins."
        ),
        required=True,
        defaultFactory=default_start,
    )

    directives.widget(
        "start",
        DatetimeFieldWidget,
        default_timezone=default_timezone,
        klass="event_start",
    )

    end = schema.Datetime(
        title=_("label_event_end", default="Event Ends"),
        description=_("help_event_end", default="Date and Time, when the event ends."),
        required=True,
        defaultFactory=default_end,
    )
    directives.widget(
        "end",
        DatetimeFieldWidget,
        default_timezone=default_timezone,
        klass="event_end",
        pattern_options={
            "behavior": "styled",
            "after": "input.event_end",
            "offset-days": "0.125",
        },
    )

    whole_day = schema.Bool(
        title=_("label_event_whole_day", default="Whole Day"),
        description=_("help_event_whole_day", default="Event lasts whole day."),
        required=False,
        default=False,
    )
    directives.widget("whole_day", SingleCheckBoxFieldWidget, klass="event_whole_day")

    open_end = schema.Bool(
        title=_("label_event_open_end", default="Open End"),
        description=_("help_event_open_end", default="This event is open ended."),
        required=False,
        default=False,
    )
    directives.widget("open_end", SingleCheckBoxFieldWidget, klass="event_open_end")

    priref = TextLine(title="Priref", required=False)

    cm_nummer = TextLine(title="cm_nummer", required=False)

    alternative_text = TextLine(title="Alternative title", required=False)

    start_date = TextLine(title="Start date", required=False)

    end_date = TextLine(title="End Date", required=False)

    organisation = TextLine(title="Organisation", required=False)

    documentation = List(
        title="Documentation",
        value_type=TextLine(),
        required=False,
    )

    exhibition_designer = schema.List(
        title="Exhibition Designer",
        description="",
        value_type=schema.Tuple(
            title="Designer",
            value_type=schema.TextLine(),
        ),
        required=False,
        default=[],
    )

    hasImage = Bool(title="Has Image", required=False)

    notes = RichText(title="Notes", required=False)

    show_notes = Bool(title="Show Notes", required=False, default=True)

    persistent_url = TextLine(title="Persisten url", required=False)

    objects = schema.List(
        title="Objects",
        description="A list of artwork IDs and titles.",
        value_type=schema.Tuple(
            title="Artwork Detail",
            value_type=schema.TextLine(),
        ),
        required=False,
        default=[],
    )

    last_successful_update = Datetime(
        title="Last Successful Update",
        description="",
        required=False,
    )

    rawdata = Text(
        title="Rawdata",
        description="",
        required=False,
    )

    searchable("priref", "cm_nummer")
