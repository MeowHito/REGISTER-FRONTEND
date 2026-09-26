import { Button, Card, Row, Col, Popover, Space, Tooltip, message } from "antd";
import CommonForm from "components/commonForm";
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, CopyOutlined, DownloadOutlined, LinkOutlined, PlusOutlined } from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import ImageUpload from "components/imageUpload";
import { useTranslation } from "react-i18next";
import { useWatch } from "antd/es/form/Form";
import { v4 as uuidv4 } from "uuid";
import fileService from "services/file.services";
import { CONTEXT_URL } from "constants/helper";

/**
 * Sponsor questionnaire groups: each has a title, a logo and a share link the organizer can
 * hand to the sponsor so they download the answers themselves (Excel, no account needed).
 * Questions are filed under a section from the question editor below.
 */
const QuestionSections = ({ form, prefix, isEditable = true }) => {
    const { t } = useTranslation();
    const sections = useWatch("questionSections", form) || [];
    const { mutate: exportQuestionnaire, isPending: isExporting } = fileService.useMutationExportQuestionnaire();

    const shareLink = (token) => `${CONTEXT_URL}/public-api/questionnaire/export?token=${token}`;

    const copyLink = async (token) => {
        try {
            await navigator.clipboard.writeText(shareLink(token));
            message.success(t("back.event.form.sectionLinkCopied"));
        } catch {
            message.info(shareLink(token));
        }
    };

    return (
        <CommonForm.List name="questionSections">
            {(fields, { add, remove, move }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => {
                        const section = sections?.[name] || {};
                        const saved = !!section.shareToken;
                        return (
                            <Card
                                key={`question-section-${key}`}
                                className="!mb-3"
                                size="small"
                                title={t("back.event.form.sectionNumber", { number: index + 1 })}
                                extra={
                                    <Space size={4}>
                                        {saved && (
                                            <>
                                                <Tooltip title={t("back.event.form.sectionExport")}>
                                                    <Button size="small" icon={<DownloadOutlined />} loading={isExporting}
                                                        onClick={() => exportQuestionnaire({ sectionId: section.id, title: section.title })} />
                                                </Tooltip>
                                                <Tooltip title={t("back.event.form.sectionCopyLink")}>
                                                    <Button size="small" icon={<LinkOutlined />} onClick={() => copyLink(section.shareToken)} />
                                                </Tooltip>
                                            </>
                                        )}
                                        {isEditable && (
                                            <>
                                                <Tooltip title={t("back.event.form.moveUp")}>
                                                    <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
                                                        onClick={() => move(index, index - 1)} />
                                                </Tooltip>
                                                <Tooltip title={t("back.event.form.moveDown")}>
                                                    <Button size="small" icon={<ArrowDownOutlined />} disabled={index === fields.length - 1}
                                                        onClick={() => move(index, index + 1)} />
                                                </Tooltip>
                                                <Popover content={t("general.buttonDelete")}>
                                                    <Button size="small" danger icon={<CloseOutlined />} onClick={() => remove(name)} />
                                                </Popover>
                                            </>
                                        )}
                                    </Space>
                                }
                            >
                                <Row gutter={12}>
                                    <Col xs={24} md={6}>
                                        <div className="rounded-xl bg-[#f5f5f7] border border-dashed border-[#d2d2d7] p-2 flex justify-center">
                                            <ImageUpload
                                                key={`logo-${key}`}
                                                label={null}
                                                prefix={prefix}
                                                filename={typeof section.logoUrl === "string" ? section.logoUrl : null}
                                                options={{
                                                    fileList: Array.isArray(section.logoFile) ? section.logoFile : [],
                                                    onChange: (list) => form.setFieldValue(["questionSections", name, "logoFile"], list),
                                                }}
                                                uploadText={t("back.event.form.sectionLogo")}
                                                isEditable={isEditable}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs={24} md={18}>
                                        <Row gutter={8}>
                                            <Col xs={24} md={12}>
                                                <CommonForm.Item
                                                    {...restField}
                                                    name={[name, "title"]}
                                                    rules={[{ required: true, message: t("required.title") }]}
                                                >
                                                    <FloatingLabel label={t("back.event.form.sectionTitle")} required readOnly={!isEditable} />
                                                </CommonForm.Item>
                                            </Col>
                                            <Col xs={24} md={12}>
                                                <CommonForm.Item {...restField} name={[name, "titleEn"]}>
                                                    <FloatingLabel label={t("back.event.form.sectionTitleEn")} readOnly={!isEditable} />
                                                </CommonForm.Item>
                                            </Col>
                                            <Col xs={24}>
                                                <CommonForm.Item {...restField} name={[name, "description"]}>
                                                    <FloatingLabel type="textarea" rows={2} label={t("back.event.form.sectionDescription")} readOnly={!isEditable} />
                                                </CommonForm.Item>
                                            </Col>
                                        </Row>
                                        {saved ? (
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6e6e73]">
                                                <span className="truncate max-w-full">{shareLink(section.shareToken)}</span>
                                                <Button size="small" icon={<CopyOutlined />} onClick={() => copyLink(section.shareToken)}>
                                                    {t("back.event.form.sectionCopyLink")}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-[#6e6e73]">{t("back.event.form.sectionLinkAfterSave")}</div>
                                        )}
                                    </Col>
                                </Row>
                            </Card>
                        );
                    })}
                    {isEditable && (
                        <CommonForm.Item>
                            <Button type="dashed" icon={<PlusOutlined />} block
                                onClick={() => add({ id: uuidv4(), title: "", titleEn: "", description: "" })}>
                                {t("back.event.form.addSection")}
                            </Button>
                        </CommonForm.Item>
                    )}
                </>
            )}
        </CommonForm.List>
    );
};

export default QuestionSections;
