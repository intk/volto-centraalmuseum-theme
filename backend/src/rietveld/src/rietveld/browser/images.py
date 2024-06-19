import json

from plone import api
from plone.namedfile.scaling import ImageScaling
from Products.CMFCore.utils import getToolByName
from Products.Five.browser import BrowserView


class FallbackImageScale(ImageScaling):
    fieldname = "preview_image"
    use_fallback_image = False

    def __init__(self, context, request):
        super(FallbackImageScale, self).__init__(context, request)

        self.context = context
        self.request = request
        self._find_fallback_image()

    def _find_fallback_image(self):
        catalog = api.portal.get_tool("portal_catalog")
        path = "/".join(self.context.getPhysicalPath())

        # Search for the slideshow folder or document directly within the context
        results = catalog.searchResults(
            {
                "path": {"query": path, "depth": 1},
                "id": "slideshow",
                "portal_type": ["Folder", "Document"],
            }
        )

        if not results:
            return

        slideshow_page = results[0].getObject()

        results = catalog.searchResults(
            {
                "path": {
                    "query": "/".join(slideshow_page.getPhysicalPath()),
                    "depth": 1,
                },
                "portal_type": "Image",
                "sort_on": "getObjPositionInParent",
            }
        )

        if results:
            self.context = results[0].getObject()
            self.fieldname = "image"
            self.use_fallback_image = True

    def scale(
        self,
        fieldname=None,
        scale=None,
        height=None,
        width=None,
        direction="thumbnail",
        pre=False,
        include_srcset=None,
        **parameters,
    ):
        fieldname = self.fieldname if self.fieldname else fieldname
        if self.use_fallback_image:
            print("Using fallback fieldname", self.fieldname)

        return super(FallbackImageScale, self).scale(
            fieldname=fieldname,
            scale=scale,
            height=height,
            width=width,
            direction=direction,
            pre=pre,
            include_srcset=include_srcset,
            **parameters,
        )


class HasFallbackImageView(BrowserView):
    def __call__(self):
        context = self.context
        request = self.request

        # Initialize as False
        use_fallback_image = False

        slideshow_page = context.get("slideshow", None)
        if slideshow_page:
            # check if slideshow has images
            use_fallback_image = any(
                obj.portal_type == "Image" for obj in slideshow_page.contentValues()
            )

        # if not use_fallback_image:
        #     # Check for a site-wide fallback image
        #     try:
        #         site = api.portal.get()
        #         obj = site.restrictedTraverse("fallback-preview-image")
        #         use_fallback_image = obj is not None
        #     except Exception:
        #         use_fallback_image = False

        request.response.setHeader("Content-Type", "application/json")
        return json.dumps({"hasFallbackImage": use_fallback_image})
