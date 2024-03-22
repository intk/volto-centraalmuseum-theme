# get a preview image
from plone import api
from plone.namedfile.scaling import ImageScaling


class FallbackImageScale(ImageScaling):
    fieldname = "preview_image"

    def __init__(self, context, request):
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
                if image.portal_type == "Image":  # Assuming the image type is "Image"
                    obj = image
                    self.fieldname = "image"
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
            except Exception:
                print("You should create /fallback-preview-image")

        print("Using", obj)
        self.context = obj or context
        self.request = request
        ImageScaling.__init__(self, self.context, self.request)

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
