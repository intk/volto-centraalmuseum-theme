from plone import api
from Products.Five.browser import BrowserView

import json


class HasExhibitionArtworks(BrowserView):
    def __call__(self):
        exhibitions_list = self.request.get("exhibitions_list")
        language = self.request.get("language")

        if not exhibitions_list:
            return json.dumps({"error": "No exhibitions list provided"})

        try:
            exhibitions_list = json.loads(exhibitions_list)
        except ValueError:
            return json.dumps({"error": "Invalid JSON format"})

        cm_nummer_to_url = {}
        site_url = api.portal.get().absolute_url()

        for exhibition in exhibitions_list:
            cm_nummer = exhibition.get("cm_nummer")
            if cm_nummer:
                results = api.content.find(
                    portal_type="exhibition", cm_nummer=cm_nummer, Language=language
                )

                if results:
                    exhibition_obj = results[0].getObject()
                    full_url = exhibition_obj.absolute_url()
                    relative_url = full_url[len(site_url) :]
                    cm_nummer_to_url[cm_nummer] = relative_url

        return json.dumps({"exhibitions_url_list": cm_nummer_to_url})
