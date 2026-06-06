import TableCell from "@tiptap/extension-table-cell";

const CustomTableCell = TableCell.extend({
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

export default CustomTableCell;
