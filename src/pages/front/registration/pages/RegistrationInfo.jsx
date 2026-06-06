import { useEffect, useState, useRef } from "react";
import { Button, Row, Result, Spin } from "antd";
import RegistrationSteps from "../components/RegistrationSteps";
import CommonForm from "components/commonForm";
import FrontLayout from "components/frontLayout";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import backOfficeServices from 'services/backoffice.services';
import { useTranslation } from 'react-i18next';
import _ from "lodash";
import { handleQueryStatus } from "utils";
import masterService from 'services/master.services';
import { useDispatch, useSelector } from 'react-redux';
import { SET_ORDER, CLEAR_ORDER, SET_PROPS } from "store/reducers/contextSlice";
import useCountryStateHook from 'hooks/useCountryStateHook';
import useMe from "hooks/useMe";
import ApplicantCard from "../components/ApplicantCard";

const RegistrationInfo = () => {
    const { t, i18n } = useTranslation();
    const currentLanguage = i18n.language?.toLowerCase();
    const { id } = useParams();
    const dispatch = useDispatch()
    const order = useSelector(state => state.context.order) || {}
    const navigate = useNavigate();
    const [form] = CommonForm.useForm();

    const [nationalityOption, setNationalityOption] = useState([]);
    const [eventConditions, setEventConditions] = useState([]);
    const [eventTypes, setEventTypes] = useState([]);
    const [friendOptions, setFriendOptions] = useState([]);
    const [teamClubOptions, setTeamClubOptions] = useState([]);

    const [defaultApplicant, setDefaultApplicant] = useState({});

    const nameInputRefs = useRef({});
    const fieldsRef = useRef([]);

    const normalizeTeam = (s) => (s || "").trim().replace(/\s+/g, " ");

    const upsertTeamClub = (name) => {
        const n = normalizeTeam(name);
        if (!n) return;

        setTeamClubOptions((prev) => {
            const key = n.toLowerCase();
            if (prev.some(x => normalizeTeam(x).toLowerCase() === key)) return prev;
            return [n, ...prev];
        });
    };

    const {
        data: me, status: meStatus, fetchStatus: meFetchStatus, isPending: isLoadingMe
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;
    const meReady = meStatus === "success";

    const {
        isLoadingProvince,
        provinceOption,
    } = useCountryStateHook({ valueKey: 'stateLocal' });

    const { data: nationalities, isFetching: isLoadingNationality, ...otherNationalities } = masterService.useQueryGetNationality();
    const { data: event, ...otherEvent } = backOfficeServices.useQueryGetEventById({ id: id, enabled: meReady });
    const { data: friendsResponse, isFetching: isLoadingFriends, ...otherFriends } = backOfficeServices.useQueryGetFriends({ enabled: meReady });

    useEffect(() => {
        if (order?.orderNo) {
            navigate("/registrationPayment", { replace: true });
            return;
        }

        if (id != order.eventId) {
            dispatch(CLEAR_ORDER())
        }
    }, []);

    useEffect(() => {
        handleQueryStatus(otherEvent, () => {
            const conditions = event?.eventConditions || [];
            const eventTypes = event?.eventTypes || [];
            setEventConditions(conditions);
            setEventTypes(eventTypes);
            dispatch(SET_PROPS({ id: "eventData", payload: event }))

            const initApplicant = _.cloneDeep(form?.getFieldValue("applicants"))
            initApplicant[0] = {
                ...initApplicant[0],
                eventDate: event?.eventDate,
                eventName: event?.name,
            };

            form.setFieldsValue({ applicants: initApplicant });
        })
    }, [otherEvent.fetchStatus])

    useEffect(() => {
        handleQueryStatus(otherNationalities, () => {
            let options = nationalities.map((n) => {
                return { value: n.alpha_3_code, label: n.nationality };
            });
            setNationalityOption(options);
        })
    }, [otherNationalities.fetchStatus])

    useEffect(() => {
        handleQueryStatus(
            { status: otherFriends.status, fetchStatus: otherFriends.fetchStatus },
            () => {
                if (!friendsResponse) return;

                const isEn = currentLanguage === "en";
                const newFriendOption = { value: "newFriend", label: t("back.reg.common.add") };
                let apiList = [];

                if (Array.isArray(friendsResponse)) {
                    apiList = friendsResponse;
                } else if (Array.isArray(friendsResponse?.data)) {
                    apiList = friendsResponse.data;
                }

                const apiOptions = apiList.map(friend => ({
                    value: friend.id,
                    label: isEn
                        ? `${friend.firstNameEn || friend.firstName || ""} ${friend.lastNameEn || friend.lastName || ""}`.trim()
                        : `${friend.firstName || ""} ${friend.lastName || ""}`.trim(),
                    data: friend
                }));

                setFriendOptions([newFriendOption, ...apiOptions]);
            },
            () => { }
        );
    }, [otherFriends.status, otherFriends.fetchStatus, friendsResponse, currentLanguage]);

    useEffect(() => {
        handleQueryStatus(
            { status: meStatus, fetchStatus: meFetchStatus },
            () => {
                let applicantsData = []
                const defaultApplicant = {
                    type: "self",
                    firstName: me?.firstName,
                    lastName: me?.lastName,
                    firstNameEn: me?.firstNameEn,
                    lastNameEn: me?.lastNameEn,
                    gender: me?.gender ? me?.gender.toLowerCase() : null,
                    birthDate: me?.birthDate ? dayjs(me?.birthDate) : null,
                    email: me?.email,
                    phone: me?.phone,
                    nationality: me?.nationality,
                    idNo: me?.idNo,
                    healthIssues: me?.healthIssues,
                    bloodType: me?.bloodType,
                    emergencyContact: me?.emergencyContact,
                    emergencyRelation: me?.emergencyRelation,
                    emergencyPhone: me?.emergencyPhone,
                    pictureUrl: me?.pictureUrl,

                    address: me?.address,
                    province: me?.province,
                    amphoe: me?.amphoe,
                    district: me?.district,
                    zipcode: me?.zipcode,

                    shippingAddress: me?.shippingAddress,
                    shippingProvince: me?.shippingProvince,
                    shippingAmphoe: me?.shippingAmphoe,
                    shippingDistrict: me?.shippingDistrict,
                    shippingZipcode: me?.shippingZipcode,

                    expandView: {
                        all: true,
                        detail: true,
                        eventType: false,
                        payment: false,
                    }
                }
                setDefaultApplicant(_.cloneDeep(defaultApplicant))
                if (order?.applicants) {
                    const existingData = _.cloneDeep(order?.applicants)
                    applicantsData = existingData.map(applicant => {
                        const selectionMap = {};

                        if (Array.isArray(applicant.selectionAnswers)) {
                            applicant.selectionAnswers.forEach(entry => {
                                const questionId = entry.question?.id;
                                const value = entry.value;

                                if (!questionId) return;

                                selectionMap[questionId] = Array.isArray(value)
                                    ? value.map(v => v.id)
                                    : value?.id;
                            });
                        }

                        return {
                            ...applicant,
                            selectionAnswers: selectionMap
                        };
                    });
                } else {
                    applicantsData = [_.cloneDeep(defaultApplicant)];
                }

                form.setFieldsValue({ applicants: applicantsData });
            },
            () => { }
        );
    }, [meStatus, meFetchStatus]);

    const handleAddNewParticipant = (add, fields) => {
        add({
            eventDate: event?.eventDate,
            eventName: event?.name,
            type: "friend",
            selectedFriendId: "newFriend",
            expandView: {
                all: true,
                detail: true,
                eventType: false,
                payment: false,
            },
            isSameAddress: true,
        });

        setTimeout(() => {
            const applicants = _.cloneDeep(form.getFieldValue("applicants")) || [];

            const updatedApplicants = applicants.map((a, idx) => ({
                ...a,
                expandView:
                    idx === applicants.length - 1
                        ? a.expandView
                        : {
                            all: false,
                            detail: false,
                            eventType: false,
                            payment: false,
                        },
            }));

            form.setFieldsValue({ applicants: updatedApplicants });

            const lastField = fields[fields.length - 1];
            if (lastField) {
                const inputEl = nameInputRefs.current[lastField.name];
                if (inputEl) inputEl.focus();
            }
        }, 100);
    };

    const expandedAll = () => {
        const applicants = _.cloneDeep(form?.getFieldValue("applicants")) || []

        const updatedApplicants = applicants.map(a => ({
            ...a,
            expandView: {
                all: true,
                detail: true,
                eventType: true,
                payment: true,
            }
        }))

        form.setFieldsValue({ applicants: updatedApplicants });
    };

    const onFinish = (values) => {
        let applicants = values.applicants || [];

        const globalFields = event?.selectionFields || [];
        const allEventTypes = event?.eventTypes || [];

        applicants = applicants.map((applicant) => {
            const eventTypeId = applicant.eventTypeId;
            const selectedEventType = allEventTypes.find(et => et.id === eventTypeId);
            const eventTypeFields = selectedEventType?.selectionFields || [];
            const allFields = [...globalFields, ...eventTypeFields];

            const age = dayjs().year() - dayjs(applicant.birthDate).year();
            const matchedGroup = selectedEventType?.ageGroups?.find(
                group =>
                    group.gender === applicant.gender &&
                    ((age >= group.minAge && age <= group.maxAge) || (age >= group.minAge && group.maxAge === null) || (age <= group.maxAge && group.minAge === null))
            );

            const { minAge, maxAge } = matchedGroup || {};

            if (minAge != null && maxAge != null) {
                applicant.ageGroupName = `${t("front.eventDetail.age")} ${minAge} - ${maxAge} ${t("front.eventDetail.year")}`;
            } else if (minAge != null) {
                applicant.ageGroupName = `${t("front.eventDetail.age")} ${minAge} ${t("front.eventDetail.orMore")}`;
            } else if (maxAge != null) {
                applicant.ageGroupName = `${t("front.eventDetail.age")}${t("front.eventDetail.notOver")} ${maxAge} ${t("front.eventDetail.year")}`;
            } else {
                applicant.ageGroupName = t("back.reg.form.noCompetitiveAgeGroup");
            }

            const answers = applicant.selectionAnswers || {};

            const structuredAnswers = Object.entries(answers)
                .map(([questionKey, answerRaw]) => {
                    const field = allFields.find(f => f.id === questionKey || f.title === questionKey);
                    if (!field) return null;

                    const question = {
                        id: field.id,
                        value: field.title,
                        valueEn: field.titleEn
                    };

                    const formatOption = (optId) => {
                        const opt = field.options.find(o => o.id === optId);
                        return opt ? {
                            id: opt.id,
                            value: opt.value,
                            valueEn: opt.valueEn,
                            inputType: opt.inputType
                        } : null;
                    };

                    if (typeof answerRaw === "object" && answerRaw?.selected !== undefined) {
                        const selectedRaw = answerRaw.selected;
                        const freeTextValues = answerRaw.freeTextValues || {};
                        
                        if (Array.isArray(selectedRaw)) {
                            const value = selectedRaw.map(optId => {
                                const opt = formatOption(optId);
                                if (!opt) return null;
                                if (opt.inputType === "FREE_TEXT" && freeTextValues[optId]) {
                                    return {
                                        ...opt,
                                        freeTextValue: freeTextValues[optId]
                                    };
                                }
                                return opt;
                            }).filter(Boolean);
                            return { question, value };
                        }
                        
                        const selectedId = selectedRaw;
                        const selectedOpt = formatOption(selectedId);
                        
                        if (selectedOpt?.inputType === "FREE_TEXT" && answerRaw.freeText) {
                            return { 
                                question, 
                                value: {
                                    ...selectedOpt,
                                    freeTextValue: answerRaw.freeText
                                }
                            };
                        }
                        return { question, value: selectedOpt };
                    }

                    let value;
                    if (Array.isArray(answerRaw)) {
                        value = answerRaw.map(a =>
                            typeof a === "object" && a.id ? a : formatOption(a)
                        ).filter(Boolean);
                    } else {
                        value = typeof answerRaw === "object" && answerRaw.id
                            ? answerRaw
                            : formatOption(answerRaw);
                    }

                    return { question, value };
                })
                .filter(Boolean);

            applicant.selectionAnswers = structuredAnswers;
            return applicant;
        });

        const registrationData = {
            ...values,
            applicants,
            eventConditions: eventConditions,
            eventId: id,
            eventData: event,
        };

        if (order?.orderNo) {
            navigate("/registrationPayment", { replace: true });
            return;
        }

        dispatch(SET_ORDER(registrationData));
        navigate(`/registrationDetail`);
    };

    if (isLoadingMe) {
        return (
            <FrontLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Spin />
                </div>
            </FrontLayout>
        )
    }

    if (!roleUser || meStatus === "error") {
        return (
            <FrontLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Result
                        status="warning"
                        title={t("general.pleaseLogin")}
                        subTitle={t("general.pleaseLoginDetail")}
                        extra={[
                            <Link to="/login" key="login">
                                <Button type="primary">{t("general.login")}</Button>
                            </Link>
                        ]}
                    />
                </div>
            </FrontLayout>
        );
    }

    if (roleUser !== "guest") {
        return (
            <FrontLayout>
                <div className="flex justify-center items-center h-[70vh]">
                    <Result
                        status="403"
                        title={t("general.noPermission")}
                        subTitle={t("general.noPermissionDetail")}
                        extra={[
                            <Link to="/contact" key="contact">
                                <Button>{t("general.contactSupport")}</Button>
                            </Link>
                        ]}
                    />
                </div>
            </FrontLayout>
        );
    }

    return (
        <FrontLayout>
            <RegistrationSteps currentStep={0} />
            <CommonForm
                form={form}
                layout="horizontal"
                labelAlign="left"
                labelCol={{ xs: { span: 24 }, sm: { span: 8 }, md: { span: 6 } }}
                wrapperCol={{ xs: { span: 24 }, sm: { span: 16 }, md: { span: 18 } }}
                className="md:!max-w-screen-lg !mx-auto"
                onFinish={onFinish}
            >
                <CommonForm.List name="applicants">
                    {(fields, { add, remove, ...restField }) => {
                        fieldsRef.current = fields;

                        return (
                            <>
                                {fields.map(({ key, name }, index) => (
                                    <ApplicantCard
                                        key={key}
                                        fieldKey={key}
                                        index={index}
                                        parentName={name}
                                        parentRemove={remove}
                                        event={event}
                                        eventTypes={eventTypes}
                                        friendOptions={friendOptions}
                                        isLoadingProvince={isLoadingProvince}
                                        countryStateProvinceOption={provinceOption}
                                        nationalityOption={nationalityOption}
                                        isLoadingNationality={isLoadingNationality}
                                        isLoadingFriends={isLoadingFriends}
                                        nameInputRefs={nameInputRefs}
                                        me={me}
                                        defaultApplicant={defaultApplicant}
                                        form={form}
                                        restField={restField}
                                        teamClubOptions={teamClubOptions}
                                        upsertTeamClub={upsertTeamClub}
                                    />
                                ))}

                                <Button type="dashed"
                                    style={{ marginBottom: 20, borderRadius: 10 }}
                                    block
                                    onClick={() => handleAddNewParticipant(add, fields)}>
                                    + {t("back.reg.common.add")} {t("back.reg.common.friend")}
                                </Button>
                            </>
                        );
                    }}
                </CommonForm.List>

                <Row className="mt-10" justify="space-between">
                    <Link to="/event">
                        <Button style={{ backgroundColor: "#FFF6E6", borderColor: "#FFF6E6" }}>
                            {t("general.back")}
                        </Button>
                    </Link>

                    <Button
                        type="primary"
                        htmlType="submit"
                        style={{ backgroundColor: "#FFB946", borderColor: "#FFB946" }}
                        onClick={expandedAll}
                    >
                        {t("general.next")}
                    </Button>
                </Row>
            </CommonForm>
        </FrontLayout>
    );
};

export default RegistrationInfo;
