export const GridSchema = (props) => {
  return {
    title: 'Praktisch info Block',
    block: '__grid',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [],
      },
      {
        id: 'slideshow',
        title: 'Slideshow Elements',
        fields: ['sliderelementslink'],
      },
    ],
    properties: {
      sliderelementslink: {
        title: 'Folder of the images',
        description:
          'By default it is showing the images in the slideshow folder, change it if you want to show images of any other folder/page',
        widget: 'object_browser',
        mode: 'link',
        selectedItemAttrs: ['Title', 'Description'],
        allowExternals: false,
      },
    },

    required: [],
  };
};

// props.data.sliderelementslink[0]['@id']
