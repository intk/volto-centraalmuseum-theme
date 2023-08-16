export const ObjectBlockSchema = (props) => {
  return {
    title: 'Object Block',
    block: 'object',
    fieldsets: [
      {
        id: 'default',
        title: 'Default',
        fields: [],
      },
    ],

    properties: {},
    required: [],
  };
};

export default ObjectBlockSchema;
