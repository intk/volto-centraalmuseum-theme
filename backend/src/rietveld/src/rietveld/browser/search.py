from plone import api
from Products.Five.browser import BrowserView

import json


def find_century(year):
    if year < 0:
        return "Voor Christus"
    elif year <= 100:
        return "1"
    elif year % 100 == 0:
        return "%s" % (str(int(year / 100)))
    else:
        return "%s" % (str(int(year / 100) + 1))


class SearchArtworks(BrowserView):
    def __call__(self):
        searchable_text = self.request.get("SearchableText")
        language = self.request.get(
            "Language", "nl"
        )  # Use a default language if not specified

        if not searchable_text:
            results = api.content.find(
                Language=language, sort_on="sortable_title", sort_order="ascending"
            )
        else:
            results = api.content.find(
                SearchableText=searchable_text,
                # portal_type='artwork',
                Language=language,
                sort_on="sortable_title",
                sort_order="ascending",
            )

        centuries = {}
        for brain in results:
            artwork = brain.getObject()
            dating = getattr(artwork, "dating", None)
            if dating:
                try:
                    # Assume dating is a year integer, adjust parsing logic as needed
                    year = int(dating)
                    century = find_century(year)
                    if century in centuries:
                        centuries[century].append(dating)
                    else:
                        centuries[century] = [dating]
                except ValueError:
                    continue  # Skip entries that do not contain valid integer years

        return json.dumps({"centuries": centuries})
