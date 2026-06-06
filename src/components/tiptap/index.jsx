import React, { useEffect, useRef, useState } from "react";
import { Button, Upload, Tooltip, ColorPicker, Slider } from "antd";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import Highlight from "@tiptap/extension-highlight";

import {
  MdDeleteForever,
  MdBorderTop,
  MdBorderLeft,
  MdFormatColorReset,
} from "react-icons/md";

import {
  BoldOutlined,
  ItalicOutlined,
  FontSizeOutlined,
  LinkOutlined,
  PictureOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UndoOutlined,
  RedoOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  TableOutlined,
  MergeCellsOutlined,
  SplitCellsOutlined,
  DeleteColumnOutlined,
  DeleteRowOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { FontSize } from "./fontSize";
import FontSizePicker from "./fontSize/fontSizePicker";
import CustomTableCell from "./table/cell";
import CustomTableHeader from "./table/header";
import CustomImage from "./image";
import { debounce } from "lodash";

const Tiptap = ({ value = "", onChange, className }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const debouncedResize = useRef(
    debounce((width, editor) => {
      editor?.chain().focus().setImageWidth(`${width}%`).run();
    }, 200)
  ).current;

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontSize,
      Link.configure({ openOnClick: false }),
      CustomImage,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  const insertImage = (src) => {
    editor?.chain().focus().setImage({ src }).run();
  };

  const handleUpload = (file) => {
    const reader = new FileReader();
    reader.onload = () => insertImage(reader.result, file);
    reader.readAsDataURL(file);
  };

  const addLink = () => {
    const url = prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const uploadProps = {
    beforeUpload: (file) => {
      handleUpload(file);
      return false;
    },
    showUploadList: false,
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div data-prevent-drag className={`tiptap-wrapper rounded-md border border-gray-200 transition-all duration-200 ${isFocused ? "!border-[#5695c4]" : ""} ${className ?? ""}`}>
      <div className={`flex flex-wrap gap-2 items-center m-2`}>
        <Tooltip zIndex={10010} title="Undo">
          <Button
            icon={<UndoOutlined />}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            type="text"
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Redo">
          <Button
            icon={<RedoOutlined />}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            type="text"
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Bold">
          <Button
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            type={editor.isActive("bold") ? "primary" : "text"}
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Italic">
          <Button
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            type={editor.isActive("italic") ? "primary" : "text"}
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Paragraph">
          <Button
            icon={<FontSizeOutlined />}
            onClick={() => editor.chain().focus().setParagraph().unsetFontSize().run()}
            type="text"
          />
        </Tooltip>

        {[1, 2, 3, 4, 5, 6].map((level) => (
          <Tooltip zIndex={10010} title={`Heading ${level}`} key={level}>
            <Button
              className="w-8 p-0"
              onClick={() =>
                editor.chain().focus().unsetFontSize().toggleHeading({ level }).run()
              }
              type={
                editor.isActive("heading", { level }) ? "primary" : "text"
              }
            >
              H{level}
            </Button>
          </Tooltip>
        ))}

        <FontSizePicker editor={editor} />

        <Tooltip title="Bullet List">
          <Button
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            type={editor.isActive('bulletList') ? 'primary' : 'text'}
          />
        </Tooltip>

        <Tooltip title="Ordered List">
          <Button
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            type={editor.isActive('orderedList') ? 'primary' : 'text'}
          />
        </Tooltip>

        <Tooltip zIndex={10010} title="Align Left">
          <Button
            icon={<AlignLeftOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            type="text"
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Align Center">
          <Button
            icon={<AlignCenterOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            type="text"
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Align Right">
          <Button
            icon={<AlignRightOutlined />}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            type="text"
          />
        </Tooltip>
        <Tooltip zIndex={10010} title="Insert Table">
          <Button
            icon={<TableOutlined />}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            type="text"
          >
          </Button>
        </Tooltip>

        <Tooltip zIndex={10010} title="Insert Link">
          <Button icon={<LinkOutlined />} onClick={addLink} type="text" />
        </Tooltip>
        <Tooltip zIndex={10010} title="Insert Image">
          <Upload {...uploadProps}>
            <Button icon={<PictureOutlined />} type="text" />
          </Upload>
        </Tooltip>
        <Tooltip zIndex={10010} title="Text Color">
          <ColorPicker
            defaultValue="#000"
            onChangeComplete={(color) => {
              editor.chain().focus().setColor(color.toHexString()).run();
            }}
            showText={false}
          />
        </Tooltip>
        <Tooltip title="Highlight Color" zIndex={10010}>
          <ColorPicker
            defaultValue="#FFFF"
            onChangeComplete={(color) =>
              editor.chain().focus().setHighlight({ color: color.toHexString() }).run()
            }
            showText={false}
          />
        </Tooltip>
      </div>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => {
          const { state } = editor;
          const { from, to } = state.selection;

          if (from === to) return false;

          let isHighlighted = false;
          state.doc.nodesBetween(from, to, node => {
            if (node.marks?.some(mark => mark.type.name === 'highlight')) {
              isHighlighted = true;
              return false;
            }
          });

          return isHighlighted;
        }}
        tippyOptions={{ placement: "top" }}
      >
        <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-md flex gap-1">
          <Tooltip title="Clear Highlight" zIndex={10010}>
            <Button
              icon={<MdFormatColorReset />}
              type="text"
              danger
              onClick={() =>
                editor.chain().focus().unsetHighlight().run()
              }
            />
          </Tooltip>
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => editor.isActive("table")}
        tippyOptions={{ placement: "top" }}
      >
        <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-md flex gap-1">
          <Tooltip zIndex={10010} title="Add Row Before">
            <Button
              icon={<VerticalAlignTopOutlined />}
              onClick={() => editor.chain().focus().addRowBefore().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Add Row After">
            <Button
              icon={<VerticalAlignBottomOutlined />}
              onClick={() => editor.chain().focus().addRowAfter().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Add Column Before">
            <Button
              icon={<VerticalAlignTopOutlined className="rotate-[90deg]" />}
              onClick={() => editor.chain().focus().addColumnBefore().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Add Column After">
            <Button
              icon={<VerticalAlignTopOutlined className="rotate-[270deg]" />}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Delete Row">
            <Button
              icon={<DeleteRowOutlined />}
              onClick={() => editor.chain().focus().deleteRow().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Delete Column">
            <Button
              icon={<DeleteColumnOutlined />}
              onClick={() => editor.chain().focus().deleteColumn().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Merge Cells">
            <Button
              icon={<MergeCellsOutlined />}
              onClick={() => editor.chain().focus().mergeCells().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Split Cell">
            <Button
              icon={<SplitCellsOutlined />}
              onClick={() => editor.chain().focus().splitCell().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Toggle Header Row">
            <Button
              icon={<MdBorderTop />}
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Toggle Header Column">
            <Button
              icon={<MdBorderLeft />}
              onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Cell Background">
            <ColorPicker
              defaultValue="#fff"
              onChangeComplete={(color) =>
                editor.chain().focus().setCellAttribute("backgroundColor", color.toHexString()).run()
              }
              showText={false}
            />
          </Tooltip>

          <Tooltip zIndex={10010} title="Delete Table">
            <Button
              icon={<MdDeleteForever />}
              onClick={() => editor.chain().focus().deleteTable().run()}
              danger
            />
          </Tooltip>
        </div>
      </BubbleMenu>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => {
          const { selection } = editor.state;
          const { $from } = selection;

          const node = $from.nodeAfter || $from.nodeBefore;
          return node?.type.name === "image";
        }}
        tippyOptions={{
          placement: "top",
          interactive: true,
          hideOnClick: false,
          trigger: "manual",
          duration: [0, 0],
          popperOptions: {
            modifiers: [
              {
                name: 'eventListeners',
                options: {
                  scroll: false,
                  resize: false,
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  padding: 8,
                  tether: false,
                },
              },
              {
                name: 'computeStyles',
                options: {
                  adaptive: false,
                  gpuAcceleration: false,
                },
              },
            ],
          },
        }}
      >
        <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-md flex gap-1">
          <Tooltip title="Align Left" zIndex={10010}>
            <Button
              icon={<AlignLeftOutlined />}
              onClick={() => editor.chain().focus().setImageAlignment("left").run()}
            />
          </Tooltip>
          <Tooltip title="Align Center" zIndex={10010}>
            <Button
              icon={<AlignCenterOutlined />}
              onClick={() => editor.chain().focus().setImageAlignment("center").run()}
            />
          </Tooltip>
          <Tooltip title="Align Right" zIndex={10010}>
            <Button
              icon={<AlignRightOutlined />}
              onClick={() => editor.chain().focus().setImageAlignment("right").run()}
            />
          </Tooltip>
          <Tooltip title="Resize Width (%)" zIndex={10010}>
            <div style={{ width: 160, padding: "0 8px" }}>
              <Slider
                min={1}
                max={100}
                defaultValue={100}
                tooltip={{ formatter: value => `${value}%` }}
                onChange={(value) => {
                  debouncedResize(value, editor);
                }}
              />
            </div>
          </Tooltip>
          <Tooltip title="Align Right" zIndex={10010}>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                const { from, to } = editor.state.selection;
                editor.commands.deleteRange({ from, to });
              }}
            />
          </Tooltip>
        </div>
      </BubbleMenu>

      <EditorContent
        className="min-h-[200px] p-2 focus:outline-none focus:ring-0"
        onFocus={handleFocus}
        onBlur={handleBlur}
        editor={editor}
      />
    </div>
  );
};

export default Tiptap;
