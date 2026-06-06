import { useState } from 'react'

export default function UseModalHook(option) {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    if (option?.insideHandleOpen) {
      option.insideHandleOpen();
    }
    setOpen(true);
  };

  const handleClose = () => {
    if (option?.insideHandleClose) {
      option.insideHandleClose();
    }
    setOpen(false);
  };

  return { open, setOpen, handleOpen, handleClose };
}
