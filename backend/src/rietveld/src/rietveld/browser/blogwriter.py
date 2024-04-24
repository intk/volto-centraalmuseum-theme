from plone import api
from plone.dexterity.utils import iterSchemata
from plone.namedfile.file import NamedBlobImage
from Products.Five.browser import BrowserView
from zope.schema import getFields

import json


class SearchBlogwriter(BrowserView):
    def __call__(self):
        blogWriterID = self.request.get("blogWriterID")
        if not blogWriterID:
            return self.error_response("Blog writer ID is required.")

        language = self.request.get("Language", "nl")

        results = api.content.find(
            portal_type="blogwriter",
            blogWriterID=blogWriterID,
            Language=language,
            sort_on="sortable_title",
            sort_order="ascending",
        )

        data = (
            [self.format_result(brain.getObject()) for brain in results]
            if results
            else []
        )

        self.request.response.setHeader("Content-Type", "application/json")
        return json.dumps(data, indent=2)

    def format_result(self, obj):
        item_data = {
            "title": obj.Title(),
            "description": obj.Description(),
            "@id": obj.absolute_url(),
        }

        # Iterate over all schemata to handle Dexterity fields
        for schema in iterSchemata(obj):
            for name, field in getFields(schema).items():
                value = getattr(obj, name, None)
                if isinstance(value, NamedBlobImage) and value:
                    # Handle image: generate a URL to access the image
                    scales = obj.restrictedTraverse("@@images")
                    preview = scales.scale(name, scale="preview")
                    item_data[name + "_url"] = preview.url if preview else ""
                else:
                    # Safely add other data ensuring it's serializable
                    item_data[name] = self.convert_to_serializable(value)

        return item_data

    def convert_to_serializable(self, value):
        """Convert types that are not serializable by default."""
        if isinstance(value, list):
            return [self.convert_to_serializable(v) for v in value]
        elif isinstance(value, dict):
            return {k: self.convert_to_serializable(v) for k, v in value.items()}
        elif callable(value):
            return value()
        return value  # Assuming simple serializable types for simplicity

    def error_response(self, message):
        """Helper method to return an error message."""
        self.request.response.setHeader("Content-Type", "application/json")
        return json.dumps({"error": message}, indent=2)
