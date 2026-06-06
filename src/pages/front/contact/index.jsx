import React from "react";
import { Button, Card, message } from "antd";
import CommonForm from "components/commonForm";
import { MailOutlined, EnvironmentOutlined, FacebookFilled, BankOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import FloatingLabel from "components/floatingLabel";
import masterService from "services/master.services";

const Contact = () => {
    const [form] = CommonForm.useForm();
    const { t } = useTranslation();

    const { mutate: sendContactEmail, isPending } = masterService.useMutationSendContactEmail(
        () => {
            message.success("ส่งข้อความเรียบร้อยแล้ว!");
            form.resetFields();
        },
        (error) => {
            message.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
            console.error("Contact email error:", error);
        }
    );

    const onFinish = (values) => {
        sendContactEmail({ values });
    };

    return (
        <div style={{ padding: "4rem", background: "#f9f9f9", minHeight: "100vh" }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                <h2 style={{ fontSize: "2rem", marginBottom: "2rem", textAlign: "center" }}>{t("front.contact.title")}</h2>
                <div className="md:flex gap-6">
                    <div className="w-full md:w-2/5 flex flex-col">
                        <Card className="rounded-2xl md:p-6 sm:p-0 h-full bg-[#fafafa] shadow-md flex-1" >
                            <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>{t("front.contact.infoTitle")}</h3>
                            <p style={{ marginBottom: "1rem", fontWeight: "bold" }}>
                                <BankOutlined style={{ marginRight: 8 }} />
                                {t("front.contact.companyName")}
                            </p>
                            <p style={{ marginBottom: "1rem" }}>
                                <EnvironmentOutlined style={{ marginRight: 8 }} />
                                {t("front.contact.address")}
                            </p>
                            <p style={{ marginBottom: "1rem" }}>
                                <MailOutlined style={{ marginRight: 8 }} />
                                Action.in.th@gmail.com
                            </p>
                            <p style={{ marginBottom: "1rem" }}>
                                <a href="https://www.facebook.com/action.in.th" target="_blank" rel="noopener noreferrer" title="Facebook">
                                    <FacebookFilled style={{ marginRight: 8, color: "#1877F2" }} />
                                    Action.in.th
                                </a>
                            </p>
                            <p style={{ marginBottom: "1rem" }}>
                                <a
                                    href="https://line.me/R/ti/p/@action.in.th"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="LINE"
                                    style={{ color: "#06C755", fontSize: "40px" }}
                                >
                                    <i className="fab fa-line"></i>
                                </a>
                            </p>
                        </Card>
                    </div>
                    <div className="w-full md:w-3/5 flex flex-col mt-6 md:mt-0">
                        <Card className="rounded-2xl shadow-md md:p-6 sm:p-0 flex-1" >
                            <CommonForm layout="vertical" form={form} onFinish={onFinish}>
                                <CommonForm.Item
                                    name="name"
                                    rules={[{ required: true, message: t("required.name") }]}
                                >
                                    <FloatingLabel
                                        label={t("front.contact.name")}
                                        type="text"
                                        required
                                    />
                                </CommonForm.Item>
                                <CommonForm.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: t("required.email") },
                                        { type: "email", message: t("validation.email") },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("general.email")}
                                        type="text"
                                        placeholder={t("front.contact.placeholder.email")}
                                        required
                                    />
                                </CommonForm.Item>
                                <CommonForm.Item
                                    name="tel"
                                    rules={[
                                        {
                                            pattern: /^[0-9]{7,15}$/,
                                            message: t("validation.phone"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("front.contact.phone")}
                                        maxLength={15}
                                        type="text"
                                        placeholder={t("front.contact.placeholder.phone")}
                                    />
                                </CommonForm.Item>
                                <CommonForm.Item
                                    name="detail"
                                    rules={[{ required: true, message: t("required.message") }]}
                                >
                                    <FloatingLabel
                                        label={t("front.contact.message")}
                                        type="textarea"
                                        placeholder={t("front.contact.placeholder.message")}
                                        required
                                    />
                                </CommonForm.Item>

                                <CommonForm.Item>
                                    <Button type="primary" size="large" htmlType="submit" loading={isPending} block>
                                        {t("front.contact.submit")}
                                    </Button>
                                </CommonForm.Item>
                            </CommonForm>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
