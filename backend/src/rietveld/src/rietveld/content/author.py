from plone.app.dexterity.textindexer.directives import searchable
from plone.app.multilingual.dx import directives
from plone.supermodel import model
from zope import schema


class IAuthor(model.Schema):
    """Schema for Author content type."""

    authorID = schema.TextLine(title="authorID", required=False)

    # TODO: make it a date?
    authorBirthDate = schema.TextLine(title="BirthDate", required=False)
    authorDeathDate = schema.TextLine(title="DeathDate", required=False)
    authorBirthPlace = schema.TextLine(title="BirthPlace", required=False)
    authorDeathPlace = schema.TextLine(title="DeathPlace", required=False)

    # this is also title
    authorName = schema.TextLine(title="authorName", required=False)
    # authorSortName = schema.TextLine(title="authorSortName", required=False)

    # # this is i18n field
    authorURL = schema.TextLine(title="authorURL", required=False)
    # authorURLTitle = schema.TextLine(title="authorURLTitle", required=False)

    directives.languageindependent(
        "authorID",
        "authorBirthDate",
        "authorDeathDate",
        "authorDeathPlace",
        "authorBirthPlace",
        "authorName",
        "authorURL",
    )

    searchable("authorID", "authorName")
