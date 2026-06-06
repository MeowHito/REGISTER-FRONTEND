import React from "react";
import { Button, Popover, Upload } from "antd";
import { PaperClipOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import _ from "lodash";

const SingleFileUploadField = ({
    fileList = [],
    tempFile = [],
    handlePreview,
    handleChange,
    onDelete,
    isMobile = false,
    disabled = false,
    label = "",
}) => {
    const currentFile = fileList.length > 0 ? fileList[0] : tempFile[0];

    return (
        <div className={isMobile ? "" : "w-full flex items-center"}>
            <Upload
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                fileList={_.size(fileList) > 0 ? fileList : _.size(tempFile) > 0 ? tempFile : []}
                accept=".jpg,.png,.pdf"
                maxCount={1}
                showUploadList={isMobile}
                onPreview={handlePreview}
                onChange={handleChange}
            >
                <Button icon={<UploadOutlined />} disabled={disabled}>
                    {label}
                </Button>
            </Upload>

            {!isMobile && currentFile && (
                <span className="w-full !ml-4 text-neutral-500 flex items-center gap-2 hover:bg-neutral-100">
                    <PaperClipOutlined />
                    <a
                        onClick={() => handlePreview(currentFile)}
                        className="w-full text-neutral-600 cursor-pointer"
                    >
                        {currentFile.name}
                    </a>
                    <Popover content="ลบไฟล์">
                        <Button
                            type="link"
                            icon={<DeleteOutlined />}
                            onClick={onDelete}
                            className="!text-neutral-500 !ml-auto"
                            disabled={disabled}
                        />
                    </Popover>
                </span>
            )}
        </div>
    );
};

export default SingleFileUploadField;
