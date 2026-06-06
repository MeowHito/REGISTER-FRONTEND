import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const type = 'DRAGGABLE_FORM_ITEM';

const DraggableFormItem = ({ index, move, className, children }) => {
  const ref = useRef();

  const [{ isOver }, drop] = useDrop({
    accept: type,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    drop: (item) => {
      if (item.index !== index) {
        move(item.index, index);
        item.index = index;
      }
    },
  });

  const [, drag] = useDrag({
    type,
    item: { index },
    canDrag: () => {
      const event = globalThis.__lastMouseDownEvent;
      if (!event) return true;

      const el = document.elementFromPoint(event.clientX, event.clientY);
      return !el?.closest?.('[data-prevent-drag]');
    },
  });

  if (typeof globalThis !== 'undefined' && !globalThis.__dragMouseHandlerAttached) {
    globalThis.__dragMouseHandlerAttached = true;
    globalThis.addEventListener('mousedown', (e) => {
      globalThis.__lastMouseDownEvent = e;
    });
  }

  drag(drop(ref));

  return (
    <div
      className={className}
      ref={ref}
      style={{
        cursor: 'move',
        marginBottom: 12,
        opacity: isOver ? 0.85 : 1,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
};

export default DraggableFormItem;
