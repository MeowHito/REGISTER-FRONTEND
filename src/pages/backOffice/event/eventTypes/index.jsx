import React, { useEffect, useRef, useState } from 'react';
import { Button, Row, Col, Popover, Collapse, Card, Switch, Space } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, CopyOutlined, PlusOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import FloatingLabel from 'components/floatingLabel';
import AgeGroups from '../ageGroups';
import Pricing from '../pricing';
import { useTranslation } from 'react-i18next';
import EventSelections from '../eventSelections';
import _ from "lodash";

const EventTypes = ({ form }) => {
    const { t } = useTranslation();
    const scrollTargetRef = useRef(null);
    const [scrollAfterDuplicate, setScrollAfterDuplicate] = useState(0);

    const regenerateEventTypeIds = (et) => {
        const out = _.cloneDeep(et);

        out.id = uuidv4();
        out.isTeam = !!et?.isTeam;

        if ("isMaleGroup" in out) out.isMaleGroup = (out.maleAgeGroups || []).length > 0;
        if ("isFemaleGroup" in out) out.isFemaleGroup = (out.femaleAgeGroups || []).length > 0;

        if (Array.isArray(out.pricing)) {
            out.pricing = out.pricing.map((p) => ({
                ...p,
                id: uuidv4(),
            }));
        }

        if (Array.isArray(out.ageGroups)) out.ageGroups = out.ageGroups.map((ag) => ({ ...ag, id: uuidv4() }));
        if (Array.isArray(out.maleAgeGroups)) out.maleAgeGroups = out.maleAgeGroups.map((ag) => ({ ...ag, id: uuidv4() }));
        if (Array.isArray(out.femaleAgeGroups)) out.femaleAgeGroups = out.femaleAgeGroups.map((ag) => ({ ...ag, id: uuidv4() }));

        if (Array.isArray(out.selectionFields)) {
            out.selectionFields = out.selectionFields.map((f) => ({
                ...f,
                id: uuidv4(),
                options: (f.options || []).map((o) => ({ ...o, id: uuidv4() })),
            }));
        }

        return out;
    };

    const getScrollParent = (node) => {
        let el = node?.parentElement;
        while (el) {
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            const canScroll = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
            if (canScroll) return el;
            el = el.parentElement;
        }
        return window;
    };

    const scrollToEventType = (renderIndex) => {
        const el = document.querySelector(`[data-eventtype-index="${renderIndex}"]`);
        if (!el) return;

        const headerOffset = 80;

        const scrollParent = getScrollParent(el);

        if (scrollParent === window) {
            const rect = el.getBoundingClientRect();
            const targetY = window.scrollY + rect.top - headerOffset;
            window.scrollTo({ top: targetY, behavior: "smooth" });
            return;
        }

        const parentRect = scrollParent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();

        const targetTop =
            scrollParent.scrollTop + (elRect.top - parentRect.top) - headerOffset;

        scrollParent.scrollTo({ top: targetTop, behavior: "smooth" });
    };

    useEffect(() => {
        if (scrollTargetRef.current == null) return;

        const renderIndex = scrollTargetRef.current;
        scrollTargetRef.current = null;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => scrollToEventType(renderIndex));
        });
    }, [scrollAfterDuplicate]);

    const handleDuplicateEventType = (index) => {
        const current = form.getFieldValue("eventTypes") || [];
        const source = current[index];
        if (!source) return;

        const cloned = regenerateEventTypeIds(source);
        const next = [...current];
        next.splice(index + 1, 0, cloned);

        scrollTargetRef.current = index + 2;
        form.setFieldValue(["eventTypes"], next);

        setScrollAfterDuplicate((x) => x + 1);
    };

    return (
        <CommonForm.List name="eventTypes">
            {(fields, { add, remove }) => {
                return (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => {
                            const items = [
                                {
                                    key: '1',
                                    label: t("back.event.form.pricingAndDiscount"),
                                    children: <Pricing form={form} eventName={name} />
                                },
                                {
                                    key: '2',
                                    label: t("back.event.form.ageGroup"),
                                    children: <AgeGroups form={form} eventName={name} />
                                },
                                {
                                    key: '3',
                                    label: t("back.event.form.selectionFields"),
                                    children: <EventSelections form={form} eventName={name} />
                                }
                            ];
                            return (
                                <Card
                                    data-eventtype-index={index + 1}
                                    className='mb-3'
                                    size="small"
                                    title={t("back.event.form.eventTypeNumber", { number: index + 1 })}
                                    key={key}
                                    extra={
                                        <Space>
                                            <Button
                                                size="small"
                                                icon={<CopyOutlined />}
                                                onClick={() => handleDuplicateEventType(index)}
                                            >
                                                {t("general.duplicate")}
                                            </Button>

                                            <Popover content={t("general.buttonDelete")}>
                                                <CloseOutlined onClick={() => remove(name)} />
                                            </Popover>
                                        </Space>
                                    }
                                >
                                    <Row gutter={{ xs: 2, md: 8 }} align="start">
                                        <Col xs={24} md={10}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "name"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: t("required.eventTypeName"),
                                                    },
                                                ]}
                                            >
                                                <FloatingLabel
                                                    size="large"
                                                    label={t("back.event.form.eventTypeName")}
                                                    required
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={7}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "eventDate"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: t("required.eventDate"),
                                                    },
                                                ]}
                                            >
                                                <FloatingLabel
                                                    type="date"
                                                    size="large"
                                                    label={t("back.event.form.eventDate")}
                                                    className="w-full"
                                                    minDate={dayjs(new Date())}
                                                    required
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={7}>
                                            <CommonForm.Item
                                                {...restField}
                                                name={[name, "quota"]}
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: t("required.quota"),
                                                    },
                                                ]}
                                            >
                                                <FloatingLabel
                                                    type="number"
                                                    size="large"
                                                    label={t("back.event.form.quota")}
                                                    className="w-full"
                                                    min={1}
                                                    required
                                                />
                                            </CommonForm.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={{ xs: 2, md: 8 }} align="start">
                                        <Col xs={24}>
                                            <div className="flex items-center gap-3 pb-3">
                                                <span>{t("back.event.form.isTeam")}</span>
                                                <CommonForm.Item
                                                    {...restField}
                                                    name={[name, "isTeam"]}
                                                    valuePropName="checked"
                                                    className="!mb-0"
                                                >
                                                    <Switch />
                                                </CommonForm.Item>
                                            </div>
                                        </Col>
                                    </Row>
                                    <CommonForm.Item noStyle shouldUpdate={(prev, curr) =>
                                        prev?.eventTypes?.[name]?.isTeam !== curr?.eventTypes?.[name]?.isTeam
                                        || prev?.eventTypes?.[name]?.teamSize !== curr?.eventTypes?.[name]?.teamSize
                                        || prev?.eventTypes?.[name]?.quota !== curr?.eventTypes?.[name]?.quota}>
                                        {() => {
                                            const et = form.getFieldValue(["eventTypes", name]) || {};
                                            if (!et.isTeam) return null;
                                            const teams = et.teamSize > 0 && et.quota > 0 ? Math.floor(et.quota / et.teamSize) : null;
                                            return (
                                                <div className="rounded-xl bg-[#fff7e6] border border-[#ffd591] px-4 pt-4 pb-1 mb-3">
                                                    <Row gutter={{ xs: 2, md: 8 }} align="start">
                                                        <Col xs={24} md={8}>
                                                            <CommonForm.Item
                                                                {...restField}
                                                                name={[name, "teamSize"]}
                                                                rules={[{ required: true, message: t("required.teamSize") }]}
                                                                extra={teams != null ? t("back.event.form.teamQuotaHint", { teams }) : null}
                                                            >
                                                                <FloatingLabel type="number" size="large" min={2}
                                                                    label={t("back.event.form.teamSize")} className="w-full" required />
                                                            </CommonForm.Item>
                                                        </Col>
                                                        <Col xs={24} md={16}>
                                                            <CommonForm.Item
                                                                {...restField}
                                                                name={[name, "teamPricing"]}
                                                                extra={t("back.event.form.teamPricingHint")}
                                                            >
                                                                <FloatingLabel type="select" size="large" allowClear={false}
                                                                    label={t("back.event.form.teamPricing")}
                                                                    options={[
                                                                        { value: "PER_PERSON", label: t("back.event.form.teamPricingPerPerson") },
                                                                        { value: "PER_TEAM", label: t("back.event.form.teamPricingPerTeam") },
                                                                    ]} />
                                                            </CommonForm.Item>
                                                        </Col>
                                                    </Row>
                                                </div>
                                            );
                                        }}
                                    </CommonForm.Item>
                                    <Collapse items={items} defaultActiveKey={["1"]} />
                                </Card>
                            )
                        })}
                        <CommonForm.Item
                            shouldUpdate={(prev, curr) => {
                                const prevLast = prev?.eventTypes?.[prev?.eventTypes?.length - 1];
                                const currLast = curr?.eventTypes?.[curr?.eventTypes?.length - 1];

                                return prevLast !== currLast;
                            }}
                            noStyle
                        >
                            {() => {
                                const list = form.getFieldValue("eventTypes") || [];
                                const last = list[list.length - 1];

                                const isAddDisabled =
                                    list.length > 0 &&
                                    (!last?.name || !last?.eventDate || !last?.quota || !last?.price);

                                return (
                                    <CommonForm.Item className="mb-3">
                                        <Button
                                            type="dashed"
                                            onClick={() => add({ id: uuidv4(), isTeam: false, teamPricing: "PER_PERSON" })}
                                            block
                                            icon={<PlusOutlined />}
                                            disabled={isAddDisabled}
                                        >
                                            {t("back.event.form.addEventType")}
                                        </Button>
                                    </CommonForm.Item>
                                );
                            }}
                        </CommonForm.Item>
                    </>
                )
            }}
        </CommonForm.List>
    );
};

export default EventTypes;
