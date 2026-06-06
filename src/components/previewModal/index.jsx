import { DownloadOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Image, Modal, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive';
import fileService from 'services/file.services';
import downloadFile from 'utils/downloadFile';

const PreviewModal = ({ open, onCancel, previewImage, fileList, tempFileList, title }) => {
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const isPdf = fileList.some((n) => n.url === previewImage && n.type === "application/pdf") || tempFileList.some((n) => n.url === previewImage && n.type === "application/pdf");
    const [visible, setVisible] = useState(false);

    const { mutateAsync: downloadImg } = fileService.useMutationDownloadImg();

    useEffect(() => {
        setVisible(open);
    }, [open]);

    const handleDownload = async () => {
        if (previewImage.startsWith("data:image/")) {
            const typeMatch = previewImage.match(/^data:image\/(\w+);base64,/);
            const ext = typeMatch?.[1] || "png";
            const timestamp = Date.now();
            const filename = `preview-${timestamp}.${ext}`;

            downloadFile(previewImage, filename);
        } else {
            const currentFile = tempFileList.find(file => file.url === previewImage);

            await downloadImg({
                filename: currentFile.name,
                fileType: currentFile.type,
                url: previewImage
            });
        }
    };

    return (
        <div>
            {isPdf ? (
                <Modal
                    width={(isPdf || isMobile) ? "90%" : "30%"}
                    className="md:!max-w-screen-lg !mx-auto"
                    open={open}
                    footer={null}
                    onCancel={onCancel}
                >
                    <iframe
                        allowFullScreen
                        src={previewImage}
                        style={{ width: "100%", height: "600px" }}
                        title={`PDF ${title} Viewer`}
                    />
                </Modal>
            ) : (
                <Image
                    src={previewImage}
                    style={{ display: 'none' }}
                    preview={{
                        visible,
                        onVisibleChange: (vis) => {
                            if (!vis) onCancel?.();
                        },
                        toolbarRender: (
                            _,
                            {
                                transform: { scale },
                                actions: {
                                    onZoomIn,
                                    onZoomOut,
                                    onReset,
                                },
                            }
                        ) => (
                            <Space size={20}>
                                <DownloadOutlined style={{ fontSize: '30px' }} onClick={handleDownload} />
                                <ZoomOutOutlined style={{ fontSize: '30px' }} disabled={scale === 1} onClick={onZoomOut} />
                                <ZoomInOutlined style={{ fontSize: '30px' }} disabled={scale === 50} onClick={onZoomIn} />
                                <UndoOutlined style={{ fontSize: '30px' }} onClick={onReset} />
                            </Space>
                        ),
                    }}
                />
            )}
        </div >
    )
}

export default PreviewModal
