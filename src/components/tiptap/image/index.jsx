import { Image } from '@tiptap/extension-image';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
      width: {
        default: '100%',
        parseHTML: element => element.style.width || element.getAttribute('width'),
        renderHTML: attributes => {
          return {
            style: `width: ${attributes.width}`,
          };
        },
      }
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),

      setImageAlignment:
        (alignment) =>
          ({ commands, state }) => {
            const { selection } = state;
            const node = state.doc.nodeAt(selection.from);
            if (node?.type.name !== 'image') return false;

            const style = `display: block; margin: ${alignment === 'center'
              ? '0 auto'
              : alignment === 'right'
                ? '0 0 0 auto'
                : '0 auto 0 0'
              };`;

            return commands.updateAttributes('image', { style });
          },

      setImageWidth:
        (width) =>
          ({ commands, state }) => {
            const { selection } = state;
            const node = state.doc.nodeAt(selection.from);
            if (node?.type.name !== 'image') return false;

            const style = node.attrs.style || '';
            return commands.updateAttributes('image', {
              width: typeof width === 'number' ? `${width}px` : width,
              style,
            });
          },
    };
  },
});

export default CustomImage;
