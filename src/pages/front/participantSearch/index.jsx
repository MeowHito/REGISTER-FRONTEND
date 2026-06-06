import { LeftOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Avatar, Button, Input, Spin, Tag, Divider, message } from "antd";
import FrontLayout from "components/frontLayout";
import dayjs from "dayjs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import generalService from "services/general.services";
import { buildAgeGroupLabel, buildAgeLabelFromAge } from "utils/ageGroup";
import { SYS_DATE_FORMAT } from "constants/helper";

/* ─── Shared sub-components ─── */
const DetailField = ({ label, children, span = 1 }) => (
    <div className={span === 2 ? "col-span-2" : ""}>
        <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
        <span className="text-sm font-medium text-gray-800">{children || "-"}</span>
    </div>
);

const SectionLabel = ({ children }) => (
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
        {children}
    </div>
);

/* ─── QR Full Detail Card ─── */
const QrDetailCard = ({ detail: p, t, renderGender, renderDeliveryMethod }) => {
    const homeAddr = [p.address, p.district, p.amphoe, p.province, p.zipcode].filter(Boolean).join(", ");
    const shippingAddr = [p.shippingAddress, p.shippingDistrict, p.shippingAmphoe, p.shippingProvince, p.shippingZipcode].filter(Boolean).join(", ");

    return (
        <div>
            {/* Success banner */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
                <CheckCircleOutlined className="text-green-500 text-lg" />
                <span className="text-green-700 font-medium">{t("front.eventDetail.qrVerified")}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header with name + BIB */}
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4 flex-wrap">
                        {p.pictureUrl && (
                            <Avatar src={`${p.prefixPath}${p.pictureUrl}`} size={64} shape="square" className="rounded-lg shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900 mb-0">
                                        {p.firstName} {p.lastName}
                                    </h2>
                                    {(p.firstNameEn || p.lastNameEn) && (
                                        <p className="text-sm text-gray-400 m-0">{p.firstNameEn} {p.lastNameEn}</p>
                                    )}
                                </div>
                                {p.bibNo && (
                                    <Tag color="blue" className="text-lg! px-4! py-1! font-bold! rounded-full! m-0!">
                                        BIB #{p.bibNo}
                                    </Tag>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Body sections */}
                <div className="px-6 py-5 flex flex-col gap-5">
                    {/* Registration */}
                    <div>
                        <SectionLabel>{t("front.eventDetail.registrationInfo")}</SectionLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                            <DetailField label={t("front.eventDetail.orderNo")}>{p.orderNo}</DetailField>
                            <DetailField label={t("front.eventDetail.eventType")}>{p.eventTypeName}</DetailField>
                            <DetailField label={t("front.eventDetail.ageGroup")}>
                                {buildAgeGroupLabel(p.ageGroupName, t, { fallback: t("general.noCompetitiveAgeGroup") })}
                            </DetailField>
                            <DetailField label={t("front.eventDetail.teamClub")}>{p.teamClub}</DetailField>
                            {p.registerDate && (
                                <DetailField label={t("front.eventDetail.registerDate")}>
                                    {dayjs(p.registerDate).format(SYS_DATE_FORMAT)}
                                </DetailField>
                            )}
                        </div>
                    </div>

                    <Divider className="my-0!" />

                    {/* Personal */}
                    <div>
                        <SectionLabel>{t("front.eventDetail.personalInfo")}</SectionLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                            <DetailField label={t("front.eventDetail.gender")}>{renderGender(p.gender)}</DetailField>
                            {p.birthDate && (
                                <DetailField label={t("front.eventDetail.birthDate")}>
                                    {dayjs(p.birthDate).format(SYS_DATE_FORMAT)}
                                </DetailField>
                            )}
                            {p.age != null && (
                                <DetailField label={t("front.eventDetail.age")}>
                                    {buildAgeLabelFromAge(p.age, t)}
                                </DetailField>
                            )}
                            <DetailField label={t("front.eventDetail.nationality")}>{p.nationality}</DetailField>
                            <DetailField label={t("front.eventDetail.idNo")}>{p.idNo}</DetailField>
                        </div>
                    </div>

                    {/* Contact */}
                    {(p.email || p.phone || homeAddr) && (
                        <>
                            <Divider className="my-0!" />
                            <div>
                                <SectionLabel>{t("front.eventDetail.contactInfo")}</SectionLabel>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                                    {p.email && <DetailField label={t("front.eventDetail.email")}>{p.email}</DetailField>}
                                    {p.phone && <DetailField label={t("front.eventDetail.phone")}>{p.phone}</DetailField>}
                                    {homeAddr && <DetailField label={t("front.eventDetail.address")} span={2}>{homeAddr}</DetailField>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Health & Emergency */}
                    {(p.bloodType || p.healthIssues || p.emergencyContact) && (
                        <>
                            <Divider className="my-0!" />
                            <div>
                                <SectionLabel>{t("front.eventDetail.healthEmergency")}</SectionLabel>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                                    {p.bloodType && (
                                        <DetailField label={t("front.eventDetail.bloodType")}>
                                            <Tag className="m-0!">{p.bloodType}</Tag>
                                        </DetailField>
                                    )}
                                    {p.healthIssues && (
                                        <DetailField label={t("front.eventDetail.healthIssues")} span={2}>{p.healthIssues}</DetailField>
                                    )}
                                    {p.emergencyContact && (
                                        <DetailField label={t("front.eventDetail.emergencyContact")}>{p.emergencyContact}</DetailField>
                                    )}
                                    {p.emergencyRelation && (
                                        <DetailField label={t("front.eventDetail.emergencyRelation")}>{p.emergencyRelation}</DetailField>
                                    )}
                                    {p.emergencyPhone && (
                                        <DetailField label={t("front.eventDetail.emergencyPhone")}>{p.emergencyPhone}</DetailField>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <Divider className="my-0!" />

                    {/* Shirt & Delivery */}
                    <div>
                        <SectionLabel>{t("front.eventDetail.shirtDelivery")}</SectionLabel>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                            <DetailField label={t("front.eventDetail.shirtSize")}>
                                {p.receiveShirt === false
                                    ? t("front.eventDetail.noShirt")
                                    : [p.shirtTypeName, p.shirtSizeName].filter(Boolean).join(" / ") || "-"}
                            </DetailField>
                            <DetailField label={t("front.eventDetail.deliveryMethod")}>
                                <Tag color={p.deliveryMethod === "post" ? "blue" : "green"} className="m-0!">
                                    {renderDeliveryMethod(p.deliveryMethod)}
                                </Tag>
                            </DetailField>
                            {p.deliveryMethod === "post" && shippingAddr && (
                                <DetailField label={t("front.eventDetail.shippingAddress")} span={2}>{shippingAddr}</DetailField>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Q&A */}
                    {Array.isArray(p.selectionAnswers) && p.selectionAnswers.length > 0 && (
                        <>
                            <Divider className="my-0!" />
                            <div>
                                <SectionLabel>{t("front.eventDetail.additionalInfo")}</SectionLabel>
                                <div className="flex flex-col gap-3">
                                    {p.selectionAnswers.map((entry, idx) => {
                                        const question = entry.question?.value || entry.question?.valueEn || "-";
                                        let answer;
                                        if (Array.isArray(entry.value)) {
                                            answer = (
                                                <span className="flex flex-wrap gap-1">
                                                    {entry.value.map((v, vi) => (
                                                        <span key={vi} className="flex items-center gap-1">
                                                            <Tag className="m-0!">{v.value || v.valueEn || "-"}</Tag>
                                                            {v.freeTextValue && <span className="text-gray-500 text-sm">{v.freeTextValue}</span>}
                                                        </span>
                                                    ))}
                                                </span>
                                            );
                                        } else if (entry.value) {
                                            answer = (
                                                <span className="flex items-center gap-1">
                                                    <Tag className="m-0!">{entry.value.value || entry.value.valueEn || "-"}</Tag>
                                                    {entry.value.freeTextValue && <span className="text-gray-500 text-sm">{entry.value.freeTextValue}</span>}
                                                </span>
                                            );
                                        } else {
                                            answer = "-";
                                        }
                                        return <DetailField key={idx} label={question}>{answer}</DetailField>;
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Remark */}
            {p.masked && (
                <p className="text-center text-gray-400 text-xs mt-4!">
                    {t("front.eventDetail.fullDetailRemark")}
                </p>
            )}
        </div>
    );
};

function ParticipantSearch() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [searchParams] = useSearchParams();

    const qr = searchParams.get("qr") || "";
    const isQrEntry = !!qr;

    const PAGE_SIZE = 20;

    const [inputText, setInputText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [items, setItems] = useState([]);
    const [hasMore, setHasMore] = useState(false);

    const qrInitializedRef = useRef(false);
    const qrErrorNotifiedRef = useRef(false);

    const resolveQuery = generalService.useQueryResolveParticipantToken({
        eventId,
        qr,
    });

    const { data: participantData, ...otherParticipant } = generalService.useQueryCheckParticipant({
        name: searchQuery,
        eventId,
        page,
        size: PAGE_SIZE,
    });

    const qrParticipantId = resolveQuery.data?.data?.participantId || "";
    const isQrResolvedSuccess = isQrEntry && !!qrParticipantId && !resolveQuery.isError;

    const { data: participantDetailData, isFetching: isDetailFetching } = generalService.useQueryGetParticipantDetail({
        participantId: qrParticipantId,
        enabled: isQrResolvedSuccess,
    });

    const qrDetail = participantDetailData?.data || null;

    const isFetchingFirstPage = useMemo(() => {
        return resolveQuery.isFetching || isDetailFetching || (otherParticipant.isFetching && page === 0);
    }, [resolveQuery.isFetching, isDetailFetching, otherParticipant.isFetching, page]);

    const shouldHideSearchBar = useMemo(() => {
        return isQrEntry && !resolveQuery.isError;
    }, [isQrEntry, resolveQuery.isError]);

    const shouldHideTopHeader = useMemo(() => {
        return isQrEntry && (resolveQuery.isFetching || isQrResolvedSuccess);
    }, [isQrEntry, resolveQuery.isFetching, isQrResolvedSuccess]);

    const showNoResult = !!searchQuery && !otherParticipant.isFetching && items.length === 0;
    const showIdleState = !searchQuery && !isFetchingFirstPage && !isQrResolvedSuccess;

    const rowLeft = "grid grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[8rem_minmax(0,1fr)] items-start gap-x-1 md:gap-x-4 text-gray-600";
    const rowRight = "grid grid-cols-[9rem_minmax(0,1fr)] md:grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-1 text-gray-600";
    const valueCls = "font-medium text-gray-900 min-w-0 whitespace-normal break-words leading-snug";

    const resetResults = useCallback(() => {
        setPage(0);
        setItems([]);
        setHasMore(false);
    }, []);

    const resetSearch = useCallback(() => {
        setInputText("");
        setSearchQuery("");
        resetResults();
    }, [resetResults]);

    const fetchMoreData = useCallback(() => {
        if (!hasMore) return;
        setPage((p) => p + 1);
    }, [hasMore]);

    const mergeUniqueByParticipantId = useCallback((prev, next) => {
        const map = new Map();
        for (const p of prev || []) map.set(p?.participantId, p);
        for (const p of next || []) map.set(p?.participantId, p);
        return Array.from(map.values());
    }, []);

    const normalize = useCallback((v) => (v ?? "").toString().trim().toLowerCase(), []);

    const renderGender = useCallback(
        (gender) => {
            const g = normalize(gender);
            if (g === "male" || g === "m") return t("front.eventDetail.male");
            if (g === "female" || g === "f") return t("front.eventDetail.female");
            return "-";
        },
        [normalize, t]
    );

    const renderDeliveryMethod = useCallback(
        (method) => {
            const m = normalize(method);
            if (m === "post" || m === "delivery" || m === "shipping") return t("front.eventDetail.post");
            if (m === "pickup" || m === "pick" || m === "pick_up") return t("front.eventDetail.pickup");
            return "-";
        },
        [normalize, t]
    );

    useEffect(() => {
        if (!isQrEntry) {
            qrInitializedRef.current = false;
            qrErrorNotifiedRef.current = false;
            return;
        }

        if (resolveQuery.isError && !qrErrorNotifiedRef.current) {
            qrErrorNotifiedRef.current = true;
            message.warning(t("front.eventDetail.invalidToken") || "QR ไม่ถูกต้องหรือหมดอายุ");
            return;
        }

        const participantId = resolveQuery.data?.data?.participantId;
        if (!participantId) return;

        if (qrInitializedRef.current) return;
        qrInitializedRef.current = true;
    }, [isQrEntry, resolveQuery.isError, resolveQuery.data, t]);

    useEffect(() => {
        if (!searchQuery) return;

        const pageObj = participantData?.data;
        if (!pageObj) return;

        const content = pageObj.content || [];
        setHasMore(!pageObj.last);

        setItems((prev) => {
            if (page === 0) return content;
            return mergeUniqueByParticipantId(prev, content);
        });
    }, [participantData, page, searchQuery, mergeUniqueByParticipantId]);

    useEffect(() => {
        const scrollableDiv = document.getElementById("scrollableDiv");
        if (scrollableDiv) scrollableDiv.scrollTo(0, 0);
        else globalThis.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (page !== 0) return;
        if (otherParticipant.isFetching) return;
        if (!participantData) return;

        const scrollableDiv = document.getElementById("scrollableDiv");
        if (scrollableDiv) scrollableDiv.scrollTo({ top: 0, behavior: "smooth" });
        else globalThis.scrollTo({ top: 0, behavior: "smooth" });
    }, [otherParticipant.isFetching, participantData, page]);

    const handleChange = useCallback((e) => {
        const v = e.target.value;
        setInputText(v);

        if (!v.trim()) {
            setSearchQuery("");
            setPage(0);
            setItems([]);
            setHasMore(false);
        }
    }, []);

    const handleSearch = useCallback(async () => {
        const q = (inputText || "").trim();
        if (!q) return;

        setPage(0);
        setHasMore(false);

        if (q === searchQuery) {
            const r = await otherParticipant.refetch();
            const pageObj = r.data?.data;
            const content = pageObj?.content ?? [];
            setHasMore(pageObj ? !pageObj.last : false);
            setItems(content);
            return;
        }

        setItems([]);
        setSearchQuery(q);
    }, [inputText, searchQuery, otherParticipant]);

    return (
        <FrontLayout title={t("front.eventDetail.searchParticipant")}>
            <div className="max-w-2xl mx-auto px-4 py-8">
                <Button
                    type="text"
                    icon={<LeftOutlined />}
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-600 hover:text-primary"
                >
                    {t("general.back")}
                </Button>

                {!shouldHideTopHeader && (
                    <div className="mb-8">
                        <h1 className="text-3xl font-light text-gray-900 mb-2">
                            {t("front.eventDetail.searchParticipant")}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {t("front.eventDetail.searchDescription") || t("front.eventDetail.searchPlaceholder")}
                        </p>
                    </div>
                )}

                {!shouldHideSearchBar && (
                    <div className="mb-8">
                        <Input.Search
                            placeholder={t("front.eventDetail.searchPlaceholder")}
                            enterButton={t("general.search") || "Search"}
                            size="large"
                            value={inputText}
                            onChange={handleChange}
                            onSearch={handleSearch}
                            onPressEnter={handleSearch}
                            onClear={resetSearch}
                            allowClear
                        />
                    </div>
                )}

                <div className="min-h-[300px]">
                    {isFetchingFirstPage && (
                        <div className="flex justify-center items-center py-16">
                            <Spin size="large" />
                        </div>
                    )}

                    {/* QR Detail View */}
                    {isQrResolvedSuccess && qrDetail && !isFetchingFirstPage && (
                        <QrDetailCard
                            detail={qrDetail}
                            t={t}
                            renderGender={renderGender}
                            renderDeliveryMethod={renderDeliveryMethod}
                        />
                    )}

                    {/* Normal search list */}
                    {!isQrResolvedSuccess && items.length > 0 && !isFetchingFirstPage && (
                        <InfiniteScroll
                            className='pb-5'
                            style={{ overflowX: 'hidden' }}
                            scrollableTarget="scrollableDiv"
                            dataLength={items.length}
                            next={fetchMoreData}
                            hasMore={hasMore}
                            loader={<h5 className="text-center mt-4 opacity-50">Loading...</h5>}
                        >
                            <div className="space-y-3">
                                {items.map((p) => (
                                    <div
                                        key={p.participantId}
                                        className="bg-white border border-gray-200 rounded-lg p-5 hover:border-primary hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {p.firstName} {p.lastName}
                                            </h3>
                                            {p.bibNo && (
                                                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                                    #{p.bibNo}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                            {/* 1) หมายเลขออเดอร์ */}
                                            <div className={`${rowLeft} order-1 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.orderNo")}</span>
                                                <span className={valueCls}>{p.orderNo || "-"}</span>
                                            </div>

                                            {/* 6) สัญชาติ */}
                                            <div className={`${rowRight} order-6 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.nationality")}</span>
                                                <span className={valueCls}>{p.nationality || "-"}</span>
                                            </div>

                                            {/* 2) ประเภทการแข่งขัน */}
                                            <div className={`${rowLeft} order-2 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.eventType")}</span>
                                                <span className={valueCls}>{p.eventType || "-"}</span>
                                            </div>

                                            {/* 4) กลุ่มอายุ */}
                                            <div className={`${rowRight} order-4 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.ageGroup")}</span>
                                                <span className={valueCls}>
                                                    {buildAgeGroupLabel(p.ageGroupName, t, { fallback: t("general.noCompetitiveAgeGroup") })}
                                                </span>
                                            </div>

                                            {/* 7) วิธีการจัดส่ง */}
                                            <div className={`${rowLeft} order-7 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.deliveryMethod")}</span>
                                                <span className={valueCls}>{renderDeliveryMethod(p.deliveryMethod)}</span>
                                            </div>

                                            {/* 5) เพศ */}
                                            <div className={`${rowRight} order-5 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.gender")}</span>
                                                <span className={valueCls}>{renderGender(p.gender)}</span>
                                            </div>

                                            {/* 8) ขนาดเสื้อ */}
                                            <div className={`${rowLeft} order-8 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.shirtSize")}</span>
                                                <span className={valueCls}>{p.shirtSize || "-"}</span>
                                            </div>

                                            {/* 3) ชมรม/ทีม */}
                                            <div className={`${rowRight} order-3 md:order-none`}>
                                                <span className="text-gray-500">{t("front.eventDetail.teamClub")}</span>
                                                <span className={valueCls}>{p.teamClub || "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfiniteScroll>
                    )}

                    {showNoResult && (
                        <div className="text-center py-16">
                            <svg
                                className="mx-auto mb-4 w-32 h-32 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            <p className="text-gray-600 text-lg font-medium mb-1">
                                {t("front.eventDetail.noParticipantFound")}
                            </p>
                            <p className="text-gray-500 text-sm">
                                {t("front.eventDetail.tryDifferentSearch") || "Try searching with a different name"}
                            </p>
                        </div>
                    )}

                    {showIdleState && (
                        <div className="text-center py-16">
                            <svg
                                className="mx-auto mb-4 w-32 h-32 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <p className="text-gray-600 text-lg font-medium mb-1">
                                {t("front.eventDetail.searchTitle") || t("front.eventDetail.searchParticipant")}
                            </p>
                            <p className="text-gray-500 text-sm">
                                {t("front.eventDetail.enterNameToSearch") ||
                                    "Enter a participant name to start searching"}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </FrontLayout>
    );
}

export default ParticipantSearch;
