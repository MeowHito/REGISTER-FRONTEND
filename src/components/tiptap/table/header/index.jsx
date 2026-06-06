import TableHeader from "@tiptap/extension-table-header";

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          return {
            style: attributes.backgroundColor
              ? `background-color: ${attributes.backgroundColor}`
              : "",
          };
        },
      },
    };
  },
});

export default CustomTableHeader;
