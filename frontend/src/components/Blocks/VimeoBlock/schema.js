export const VimeoBlockSchema = (props) => {
  return {
    title: 'Vimeo Block',
    block: '__grid',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [
          'VideoLink',
          'FirstFrame',
          'button1',
          'button1link',
          'button2',
          'button2link',
          'button3',
          'button3link',
        ],
      },
    ],

    properties: {
      VideoLink: {
        title: 'Video Link',
        widget: 'url',
      },
      FirstFrame: {
        title: 'First frame of the video',
        widget: 'object_browser',
        mode: 'image',
        allowExternals: true,
      },
      button1: {
        type: 'sting',
        title: 'Button 1',
      },
      button1link: {
        type: 'sting',
        title: 'Button 1 Link',
      },
      button2: {
        type: 'sting',
        title: 'Button 2',
      },
      button2link: {
        type: 'sting',
        title: 'Button 2 Link',
      },
      button3: {
        type: 'sting',
        title: 'Button 3',
      },
      button3link: {
        type: 'sting',
        title: 'Button 3 Link',
      },
    },
    required: [],
  };
};

export default VimeoBlockSchema;
