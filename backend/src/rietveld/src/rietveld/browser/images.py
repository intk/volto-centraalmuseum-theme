from plone import api
from plone.namedfile.scaling import ImageScaling
from Products.Five.browser import BrowserView
import json

class FallbackImageScale(ImageScaling):
    fieldname = "preview_image"
    use_fallback_image = False

    def __init__(self, context, request):
        super(FallbackImageScale, self).__init__(context, request)
        obj = None
        slideshow_page = None

        # Attempt to find the "Slideshow" page within the context
        for child in context.contentValues():
            if child.id == "slideshow":  # Check if the child is the "Slideshow" page
                slideshow_page = child
                break

        # If the "Slideshow" page exists, find the first image
        if slideshow_page is not None:
            for image in slideshow_page.contentValues():
                if image.portal_type == "Image":
                    obj = image
                    self.fieldname = "image"
                    self.use_fallback_image = True
                    break

        # if obj is None:
        #     # If no slideshow or no image in the slideshow, use the container's top image
        #     for child in context.contentValues():
        #         if getattr(
        #             child, "image", None
        #         ):  # Assuming direct children could have an "image" attribute
        #             obj = child
        #             self.fieldname = "image"
        #             break
        #         elif getattr(child, "preview_image", None):
        #             obj = child
        #             break

        # Fallback to a default image if no image is found in the "Slideshow" page
        if obj is None:
            try:
                site = api.portal.get()
                obj = site.restrictedTraverse("fallback-preview-image")
                self.fieldname = "image"
                self.use_fallback_image = True
            except Exception:
                print("Fallback preview image not found.")
                self.use_fallback_image = False

        print("Using", obj)
        self.context = obj or context
        self.request = request

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
        if self.fieldname:
            print("Using fallback fieldname", self.fieldname)
            return super(FallbackImageScale, self).scale(
                fieldname=self.fieldname,
                scale=scale,
                height=height,
                width=width,
                direction=direction,
                pre=pre,
                include_srcset=include_srcset,
                **parameters,
            )

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

        # Attempt to replicate logic here to check for fallback image
        # For example, this might check if a certain image field is empty
        # or if a specific named image (e.g., 'fallback-preview-image') exists
        slideshow_page = context.get('slideshow', None)
        if slideshow_page:
            # Example: check if slideshow has images
            use_fallback_image = any(obj.portal_type == "Image" for obj in slideshow_page.contentValues())

        if not use_fallback_image:
            # Check for a site-wide fallback image
            try:
                site = api.portal.get()
                obj = site.restrictedTraverse("fallback-preview-image")
                use_fallback_image = obj is not None
            except Exception:
                use_fallback_image = False

        request.response.setHeader('Content-Type', 'application/json')
        return json.dumps({'hasFallbackImage': use_fallback_image})
