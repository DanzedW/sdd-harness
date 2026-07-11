import { Button, Modal } from "antd";
import type { ReactNode } from "react";

interface DetailModalProps {
  title: string;
  open: boolean;
  width?: number;
  children: ReactNode;
  onClose: () => void;
}

export function DetailModal({ title, open, width = 800, children, onClose }: DetailModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={width}
      destroyOnClose
    >
      {children}
    </Modal>
  );
}
