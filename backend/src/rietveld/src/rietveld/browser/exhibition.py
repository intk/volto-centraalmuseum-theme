from plone import api
from Products.Five.browser import BrowserView

import json


class HasArtworks(BrowserView):
    def __call__(self):
        artworks_list = self.request.get("artworks_list")
        language = self.request.get("language")

        if not artworks_list:
            return json.dumps({"error": "No exhibitions list provided"})

        try:
            artworks_list = json.loads(artworks_list)
        except ValueError:
            return json.dumps({"error": "Invalid JSON format"})

        priref_to_url = {}
        site_url = api.portal.get().absolute_url()

        for artwork in artworks_list:
            priref = artwork.get("priref")
            if priref:
                results = api.content.find(
                    portal_type="artwork", priref=priref, Language=language
                )
                if results:
                    artwork_obj = results[0].getObject()
                    full_url = artwork_obj.absolute_url()
                    relative_url = full_url[len(site_url) :]
                    priref_to_url[priref] = relative_url

        return json.dumps({"artworks_url_list": priref_to_url})
