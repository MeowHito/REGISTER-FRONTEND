import React, { useState, useMemo, useEffect, useRef } from "react";
import { Button, Select, Radio, Row, Col, Alert, Divider, Checkbox, Space, message, Spin } from "antd";
import CommonForm from "components/commonForm";
import dayjs from "dayjs";
import { DownOutlined, UpOutlined, ExpandAltOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import _ from "lodash";
import { bloodGroupOption } from 'constants/options/bloodGroupOption';
import { validateIDCard } from "utils/validate";
import ImageUpload from 'components/imageUpload';
import { useMediaQuery } from 'react-responsive';
import ProvinceSelector from 'components/provinceSelector';
import FloatingLabel from 'components/floatingLabel';
import generalService from 'services/general.services';
import PriceChangeModal from 'components/alert/PriceChangeModal';

const ApplicantCard = React.memo(({
  fieldKey,
  index,
  parentName,
  parentRemove,
  event,
  eventTypes,
  friendOptions,
  isLoadingProvince,
  countryStateProvinceOption,
  nationalityOption,
  isLoadingNationality,
  isLoadingFriends,
  nameInputRefs,
  me,
  defaultApplicant,
  form,
  teamClubOptions,
  upsertTeamClub
}) => {
  const prefix = "userData";
  const { t, i18n } = useTranslation();
  const firstName = CommonForm.useWatch(["applicants", parentName, "firstName"], form);
  const lastName = CommonForm.useWatch(["applicants", parentName, "lastName"], form);
  const pictureUrl = CommonForm.useWatch(["applicants", parentName, "pictureUrl"], form);
  const selectedFriendId = CommonForm.useWatch(["applicants", parentName, "selectedFriendId"], form);
  const gender = CommonForm.useWatch(["applicants", parentName, "gender"], form);
  const birthDate = CommonForm.useWatch(["applicants", parentName, "birthDate"], form);
  const eventTypeId = CommonForm.useWatch(["applicants", parentName, "eventTypeId"], form);
  const pricingStartDate = CommonForm.useWatch(["applicants", parentName, "pricingStartDate"], form);
  const pricingEndDate = CommonForm.useWatch(["applicants", parentName, "pricingEndDate"], form);
  const noShirt = CommonForm.useWatch(["applicants", parentName, "noShirt"], form);
  const deliveryMethod = CommonForm.useWatch(["applicants", parentName, "deliveryMethod"], form);
  const price = CommonForm.useWatch(["applicants", parentName, "price"], form);
  const paymentName = CommonForm.useWatch(["applicants", parentName, "paymentName"], form);
  const type = CommonForm.useWatch(["applicants", parentName, "type"], form);
  const shirtTypeId = CommonForm.useWatch(["applicants", parentName, "shirtTypeId"], form);
  const isSameAddress = CommonForm.useWatch(["applicants", parentName, "isSameAddress"], form);

  const allView = CommonForm.useWatch(["applicants", parentName, "expandView", "all"], form);
  const detailView = CommonForm.useWatch(["applicants", parentName, "expandView", "detail"], form);
  const eventTypeView = CommonForm.useWatch(["applicants", parentName, "expandView", "eventType"], form);
  const paymentView = CommonForm.useWatch(["applicants", parentName, "expandView", "payment"], form);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const [addressGroups, setAddressGroups] = useState([]);
  const [checkingQuota, setCheckingQuota] = useState(false);
  const [quotaAvailable, setQuotaAvailable] = useState(true);
  const [eventTypesAvailability, setEventTypesAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [priceChangeModal, setPriceChangeModal] = useState({
    open: false,
    oldPrice: 0,
    newPrice: 0,
  });
  const [teamClubSearch, setTeamClubSearch] = useState("");
  const [debouncedTeamClubSearch, setDebouncedTeamClubSearch] = useState("");

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const isMobileSmall = useMediaQuery({ query: "(max-width: 320px)" });

  const labelCol = { xs: { span: 10 }, sm: 8 };
  const wrapperCol = { xs: { span: 16 }, sm: 16 };
  const fullWidthItem = { labelCol: { span: 0 }, wrapperCol: { span: 24 } };

  const mustFillShipping = deliveryMethod === "post" && (!fieldKey || !isSameAddress);

  const isTeamEvent = useMemo(() => {
    const et = eventTypes.find(et => et.id === eventTypeId);
    return !!et?.isTeam;
  }, [eventTypes, eventTypeId]);

  const prevIsTeamRef = useRef(isTeamEvent);

  const validateAgeGroup = useMemo(() => {
    if (!gender || !birthDate || !eventTypeId) return { status: 'incomplete' };

    const eventType = eventTypes.find(et => et.id === eventTypeId);

    if (!eventType?.ageGroups?.length) {
      const age = dayjs().year() - dayjs(birthDate).year();
      return { status: 'noAgeGroups', age };
    }

    const age = dayjs().year() - dayjs(birthDate).year();

    const matched = eventType.ageGroups.find(group =>
      group.gender === gender &&
      ((age >= group.minAge && age <= group.maxAge) || (age >= group.minAge && group.maxAge === null) || (age <= group.maxAge && group.minAge === null))
    );

    return matched ? { status: 'valid', matched, age } : { status: 'invalid', age }
  }, [gender, birthDate, eventTypeId, eventTypes])

  const getAvailablePricingMutation = generalService.useMutationGetAvailablePricing();
  const getEventTypesAvailabilityMutation = generalService.useMutationGetEventTypesAvailability();
  const {
    data,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = generalService.useInfiniteTeamClubsByEventType({
    eventTypeId,
    limit: 30,
    search: debouncedTeamClubSearch,
    enabled: isTeamEvent && !!eventTypeId,
  });

  const updateAddressGroups = () => {
    const applicants = form?.getFieldValue("applicants") || []

    if (!applicants || !Array.isArray(applicants) || applicants.length === 0) {
      setAddressGroups([]);
      return;
    }

    const grouped = applicants.filter(appicant => appicant.deliveryMethod === "post" && !appicant.isSameAddress).reduce((acc, applicant) => {
      const {
        shippingAddress = "", shippingProvince = "", shippingAmphoe = "", shippingDistrict = "", shippingZipcode = "",
        firstName = t("general.unknown"), lastName = t("general.unknown")
      } = applicant || {};

      if (!shippingAddress || !shippingProvince || !shippingAmphoe || !shippingDistrict || !shippingZipcode) {
        return acc;
      }

      const key = `${shippingAddress}-${shippingProvince}-${shippingAmphoe}-${shippingDistrict}-${shippingZipcode}`;
      if (!acc[key]) acc[key] = { shippingAddress: key, users: [] };
      acc[key].users.push(`${firstName} ${lastName}`);

      return acc;
    }, {});

    setAddressGroups(Object.values(grouped));
  };

  const handleDropdownOpen = async (open) => {
    if (open && event?.id) {
      setLoadingAvailability(true);
      try {
        const result = await getEventTypesAvailabilityMutation.mutateAsync(event.id);
        if (result?.success && result?.data) {
          setEventTypesAvailability(result.data);
        }
      } catch (error) {
        console.error('Error fetching event types availability:', error);
      }
      setLoadingAvailability(false);
    }
  };

  const eventTypeOptions = useMemo(() => {
    return eventTypes.map((type) => {
      const availability = eventTypesAvailability.find(a => a.eventTypeId === type.id);
      const isAvailable = availability?.isAvailable ?? true;

      return {
        value: type.id,
        label: type.name,
        disabled: !isAvailable,
      };
    });
  }, [eventTypes, eventTypesAvailability, t]);

  const handleEventTypeChange = async (value) => {
    const eventType = eventTypes.find(r => r.id === value);
    if (!eventType) return;

    setCheckingQuota(true);
    setQuotaAvailable(true);

    const availabilityInfo = eventTypesAvailability.find(a => a.eventTypeId === value);

    let pricingToUse = {
      id: availabilityInfo?.pricingId ?? null,
      price: availabilityInfo?.currentPrice ?? eventType.price,
      paymentName: availabilityInfo?.paymentName ?? null,
      startDate: availabilityInfo?.startDate ?? null,
      endDate: availabilityInfo?.endDate ?? null,
      isSpecialPrice: availabilityInfo?.isSpecialPrice ?? false,
      availableQuota: availabilityInfo?.availableQuota ?? null,
      totalQuota: availabilityInfo?.totalQuota ?? null,
      registeredCount: availabilityInfo?.registeredCount ?? null
    };

    if (availabilityInfo?.currentPrice !== undefined) {
      if (!availabilityInfo.isAvailable) {
        setQuotaAvailable(false);
        message.warning(t('back.reg.common.quotaUnavailable'));
      }
    } else {
      try {
        const result = await getAvailablePricingMutation.mutateAsync(eventType.id);

        if (result?.success && result?.data) {
          const availablePricing = result.data;
          pricingToUse = {
            id: availablePricing.id,
            price: availablePricing.price ?? availablePricing.currentPrice,
            paymentName: availablePricing.paymentName,
            startDate: availablePricing.startDate,
            endDate: availablePricing.endDate,
            isSpecialPrice: availablePricing.isSpecialPrice,
            availableQuota: availablePricing.availableQuota ?? availabilityInfo?.availableQuota,
            totalQuota: availablePricing.totalQuota ?? availabilityInfo?.totalQuota,
            registeredCount: availablePricing.registeredCount ?? availabilityInfo?.registeredCount,
          };
        } else {
          setQuotaAvailable(false);
          message.warning(result?.message || t('back.reg.common.quotaUnavailable'));
        }
      } catch (error) {
        console.error('Error getting available pricing:', error);
        setQuotaAvailable(false);
        message.error(t('back.reg.common.pricingError'));
      }
    }

    const current = form.getFieldValue(["applicants", parentName]);

    const updated = {
      ...current,
      eventTypeId: eventType.id,
      eventDate: event.eventDate,
      eventName: event.name,
      eventTypeName: eventType.name,
      price: pricingToUse.price,
      pricingId: pricingToUse.isSpecialPrice ? pricingToUse.id : null,
      paymentName: pricingToUse.paymentName,
      pricingStartDate: pricingToUse.startDate,
      pricingEndDate: pricingToUse.endDate,
      isSpecialPrice: pricingToUse.isSpecialPrice,
      availableQuota: pricingToUse.availableQuota,
      totalQuota: pricingToUse.totalQuota,
      registeredCount: pricingToUse.registeredCount,
      selectionAnswers: {},
      expandView: {
        ...current.expandView,
        all: true,
        eventType: true,
        detail: true,
      },
    };
    setSelectedEventType(eventType);

    form.setFieldValue(["applicants", parentName], updated);
    setCheckingQuota(false);
  };

  const remoteTeamClubs = useMemo(() => {
    if (!isTeamEvent) return [];
    const pages = data?.pages || [];
    return pages.flatMap(p => p.items || []);
  }, [data, isTeamEvent]);

  const mergedTeamClubOptions = useMemo(() => {
    const normalize = (s) => (s || "").trim().replace(/\s+/g, " ");
    const seen = new Set();

    const merged = [
      ...(teamClubOptions || []),
      ...(remoteTeamClubs || []),
    ];

    return merged
      .map(normalize)
      .filter(Boolean)
      .filter((x) => {
        const k = x.toLowerCase();
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((x) => ({ value: x, label: x }));
  }, [teamClubOptions, remoteTeamClubs]);

  const handleTeamClubPopupScroll = (e) => {
    const target = e.target;
    const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 8;
    if (isBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const handleShirtTypeChange = (value) => {
    const selectedShirtType = event?.shirtTypes?.find(type => type.id === value);
    if (!selectedShirtType) return;

    const { id, name } = selectedShirtType;

    const current = form.getFieldValue(["applicants", parentName]);
    const updated = {
      ...current,
      shirtTypeId: id,
      shirtTypeName: name,
      shirtSizeId: undefined,
      shirtSizeName: undefined,
      shirtSizeLength: undefined,
    };

    form.setFieldValue(["applicants", parentName], updated);
  };

  const handleShirtSizeChange = (value) => {
    const selectedSize = event?.shirtTypes
      ?.flatMap(type => type.shirtSizes || [])
      .find(size => size.id === value);

    if (!selectedSize) return;

    const { name: sizeName, lengthSize, chestSize } = selectedSize;

    const current = form.getFieldValue(["applicants", parentName]);

    const updated = {
      ...current,
      shirtSizeId: value,
      shirtSizeName: sizeName,
      shirtSizeLength: lengthSize,
      shirtSizeChestSize: chestSize
    };

    form.setFieldValue(["applicants", parentName], updated);
  };

  const handleAddressChange = (value) => {
    if (!value) return;
    const applicants = _.cloneDeep(form?.getFieldValue("applicants")) || []

    const selectedAddress = addressGroups.find((group) => group.shippingAddress === value);
    if (!selectedAddress) return;

    const [shippingAddress, shippingProvince, shippingAmphoe, shippingDistrict, shippingZipcode] = value.split("-");

    let sameAddressGroup;

    if (parentName) {
      const existingGroup = applicants?.find(applicant =>
        applicant.shippingAddress?.trim() === shippingAddress?.trim() &&
        applicant.shippingProvince?.trim() === shippingProvince?.trim() &&
        applicant.shippingAmphoe?.trim() === shippingAmphoe?.trim() &&
        applicant.shippingDistrict?.trim() === shippingDistrict?.trim() &&
        applicant.shippingZipcode?.trim() === shippingZipcode?.trim()
      );

      sameAddressGroup = existingGroup?.sameAddressGroup ?? `group_${Date.now()}`;
    }

    const current = form.getFieldValue(["applicants", parentName]);

    const updated = { ...current, shippingAddress, shippingProvince, shippingAmphoe, shippingDistrict, shippingZipcode, sameAddressGroup }

    form.setFieldValue(["applicants", parentName], updated);
  };

  const handleFriendSelect = (friendId) => {
    const current = form.getFieldValue(["applicants", parentName]);

    let updated = {
      type: "friend",
      selectedFriendId: 'newFriend',
      expandView: {
        all: true,
        detail: true,
        eventType: false,
        payment: false,
      }
    }
    if (friendId !== 'newFriend') {
      if (!friendOptions) return;
      const selectedFriend = friendOptions?.find(f => f.value === friendId)?.data || {};
      if (!selectedFriend) return;

      updated = {
        ...current,
        type: "friend",
        selectedFriendId: friendId,
        firstName: selectedFriend.firstName,
        lastName: selectedFriend.lastName,
        firstNameEn: selectedFriend.firstNameEn,
        lastNameEn: selectedFriend.lastNameEn,
        gender: selectedFriend.gender ? selectedFriend.gender.toLowerCase() : null,
        birthDate: selectedFriend.birthDate ? dayjs(selectedFriend.birthDate) : null,
        email: selectedFriend.email,
        phone: selectedFriend.phone,
        nationality: selectedFriend.nationality,
        idNo: selectedFriend.idNo,
        healthIssues: selectedFriend.healthIssues,
        bloodType: selectedFriend.bloodType,
        emergencyContact: selectedFriend.emergencyContact,
        emergencyRelation: selectedFriend.emergencyRelation,
        emergencyPhone: selectedFriend.emergencyPhone,
        pictureUrl: selectedFriend.pictureUrl,

        address: selectedFriend.address,
        province: selectedFriend.province,
        amphoe: selectedFriend.amphoe,
        district: selectedFriend.district,
        zipcode: selectedFriend.zipcode,

        shippingAddress: selectedFriend.shippingAddress,
        shippingProvince: selectedFriend.shippingProvince,
        shippingAmphoe: selectedFriend.shippingAmphoe,
        shippingDistrict: selectedFriend.shippingDistrict,
        shippingZipcode: selectedFriend.shippingZipcode,
      }
    }

    form.setFieldValue(["applicants", parentName], updated);
  }

  const getFilteredFriendOptions = () => {
    const applicants = form?.getFieldValue("applicants") || []
    const selectedIdsInOtherForms = (applicants || [])
      .map((applicant, index) => (index === parentName ? null : applicant.selectedFriendId))
      .filter(id => id && id != 'newFriend');

    return (friendOptions || []).filter(option => {
      if (option.value === 'newFriend') return true;

      const currentSelection = applicants?.[parentName]?.selectedFriendId;
      if (option.value === currentSelection) return true;

      return !selectedIdsInOtherForms.includes(option.value);
    })
  }

  const handleToggleSection = (sectionName) => {
    const current = form.getFieldValue(["applicants", parentName]);
    const updated = {
      ...current,
      expandView: {
        ...current.expandView,
        [sectionName]: !current?.expandView?.[sectionName]
      }
    };
    form.setFieldValue(["applicants", parentName], updated);
  };

  const handleToggleExpand = () => {
    const current = form.getFieldValue(["applicants", parentName]);

    const updated = {
      ...current,
      expandView: {
        ...current.expandView,
        all: !current?.expandView?.all,
        detail: true
      }
    };
    form.setFieldValue(["applicants", parentName], updated);
  };

  const handleToggleExpandAll = () => {
    const current = form.getFieldValue(["applicants", parentName]);

    const updated = {
      ...current,
      expandView: {
        all: true,
        detail: true,
        eventType: true,
        payment: true,
      }
    };

    form.setFieldValue(["applicants", parentName], updated);
  };

  useEffect(() => {
    if (!eventTypeId || !eventTypesAvailability.length) return;

    const availabilityInfo = eventTypesAvailability.find(a => a.eventTypeId === eventTypeId);
    if (!availabilityInfo) return;

    const current = form.getFieldValue(["applicants", parentName]);
    const currentPrice = current?.price;
    const newPrice = availabilityInfo.currentPrice;

    if (currentPrice !== undefined && newPrice !== undefined && currentPrice !== newPrice) {
      setPriceChangeModal({
        open: true,
        oldPrice: currentPrice,
        newPrice: newPrice,
      });
    }

    form.setFieldValue(["applicants", parentName], {
      ...current,
      price: availabilityInfo.currentPrice ?? current.price,
      paymentName: availabilityInfo.paymentName ?? current.paymentName,
      isSpecialPrice: availabilityInfo.isSpecialPrice ?? current.isSpecialPrice,
      availableQuota: availabilityInfo.availableQuota,
      totalQuota: availabilityInfo.totalQuota,
      registeredCount: availabilityInfo.registeredCount,
    });

    if (!availabilityInfo.isAvailable) {
      setQuotaAvailable(false);
    }
  }, [eventTypesAvailability, eventTypeId, form, parentName, t]);

  useEffect(() => {
    const et = eventTypes.find(et => et.id === eventTypeId) || null;
    setSelectedEventType(et);
  }, [eventTypeId, eventTypes]);

  useEffect(() => {
    if (prevIsTeamRef.current && !isTeamEvent) {
      form.setFieldValue(["applicants", parentName, "teamClub"], undefined);
      form.setFields([{ name: ["applicants", parentName, "teamClub"], errors: [] }]);
    }

    prevIsTeamRef.current = isTeamEvent;
  }, [isTeamEvent, form, parentName]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTeamClubSearch(teamClubSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [teamClubSearch]);

  useEffect(() => {
    setTeamClubSearch("");
    setDebouncedTeamClubSearch("");
  }, [eventTypeId]);

  return (
    <>
      <PriceChangeModal
        open={priceChangeModal.open}
        oldPrice={priceChangeModal.oldPrice}
        newPrice={priceChangeModal.newPrice}
        title={t("back.reg.common.priceUpdated")}
        currency={t("front.eventDetail.baht")}
        onClose={() => setPriceChangeModal(prev => ({ ...prev, open: false }))}
      />
      <div key={`applicant-${index}`} style={{ border: "1px solid #ddd", padding: 20, marginBottom: 20, borderRadius: 10 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Col span={20}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 mb-2">
              <div className="text-xl font-semibold m-0">
                {t("back.reg.common.applicantInfo")}
              </div>

              <div className="flex items-center gap-1 sm:gap-2 flex-nowrap">
                <Button
                  type="link"
                  onClick={handleToggleExpand}
                  className="!p-0 whitespace-nowrap"
                >
                  {allView ? t("back.reg.common.hideDetail") : t("back.reg.common.showDetail")}
                </Button>

                {allView && (!paymentView || !detailView || !eventTypeView) && (
                  <>
                    <Divider type="vertical" className="hidden sm:inline-block !mx-1" />
                    <Button
                      type="link"
                      className="!p-0 whitespace-nowrap"
                      onClick={handleToggleExpandAll}
                    >
                      {isMobileSmall ? t("back.reg.common.expand") : t("back.reg.common.expandAll")} <ExpandAltOutlined />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Col>
          <Col span={4} style={{ textAlign: "right" }}>
            {!!fieldKey && (
              <Button
                danger
                type="primary"
                size="small"
                shape="round"
                onClick={() => parentRemove(parentName)}
                style={{
                  backgroundColor: "#ff4d4f",
                  borderColor: "#ff4d4f",
                }}
              >
                {t("back.reg.common.delete")}
              </Button>
            )}
          </Col>
        </Row>
        {!allView && (
          (() => {
            const hasName = firstName || lastName;
            return hasName ? (
              <div style={{ fontWeight: "bold", color: "#555", marginTop: 4 }}>
                👤 {[firstName, lastName].join(" ")}
              </div>
            ) : null;
          })()
        )}
        {allView && (
          <div className="flex flex-col">
            <div className="order-3 flex items-center justify-start mb-2 bg-slate-50 px-4 border border-slate-200 rounded">
              <Divider orientation="left" className="!mb-0 !mt-0">
                {t("back.reg.common.applicant")}
                <Button type="link" onClick={() => handleToggleSection('detail')}>
                  {detailView ? <UpOutlined /> : <DownOutlined />}
                </Button>
              </Divider>
            </div>
            <div className={`order-4 ${detailView ? "block" : "hidden"}`}>
              <CommonForm.Item name={[parentName, "type"]} label={<span className="font-semibold">{t("back.reg.common.selectApplicant")}</span>}>
                <Space wrap align="center">
                  {fieldKey ? (
                    <Radio.Group>
                      <Radio.Button value="friend">{t("back.reg.common.friend")}</Radio.Button>
                    </Radio.Group>
                  ) : (
                    <Radio.Group
                      onChange={e => {
                        const value = e.target.value
                        let updated = _.cloneDeep(defaultApplicant)
                        if (value === "friend") {
                          updated = {
                            type: "friend",
                            selectedFriendId: 'newFriend',
                            expandView: {
                              all: true,
                              detail: false,
                              eventType: true,
                              payment: false,
                            }
                          }
                        }

                        form.setFieldValue(["applicants", parentName], updated);
                      }}

                    >
                      <Radio.Button value="self">
                        {`${me?.firstName || ""} ${me?.lastName || ""}`.trim() || t("back.reg.common.self")}
                      </Radio.Button>
                      <Radio.Button value="friend">{t("back.reg.common.friend")}</Radio.Button>
                    </Radio.Group>
                  )}

                  {(fieldKey ? true : type === 'friend') &&
                    <Select
                      showSearch
                      allowClear
                      value={selectedFriendId}
                      placeholder={t("back.reg.form.searchFriend")}
                      options={getFilteredFriendOptions()}
                      loading={isLoadingFriends}
                      onChange={handleFriendSelect}
                      style={{ width: 250, textAlign: 'left' }}
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                    />
                  }
                </Space>
              </CommonForm.Item>

              <Row gutter={isMobile ? [16, 0] : [16, 16]} className="mb-4">
                {isMobile ? (
                  <>
                    <Col span={24}>
                      <div className="text-left mb-2">
                        {t("back.setting.profile.profileImg")}
                      </div>
                    </Col>
                    <Col span={24}>
                      <div className="flex justify-center">
                        <div className="inline-flex">
                          <ImageUpload
                            key={`img-${fieldKey}`}
                            label={null}
                            prefix={prefix}
                            filename={!Array.isArray(pictureUrl) ? pictureUrl : null}
                            options={{
                              fileList: Array.isArray(pictureUrl) ? pictureUrl : [],
                              onChange: (newFileList) => {
                                form.setFieldValue(["applicants", parentName, "pictureUrl"], newFileList);
                              },
                            }}
                            uploadText={t("general.uploadImg")}
                          />
                        </div>
                      </div>
                    </Col>
                  </>
                ) : (
                  <Col>
                    <ImageUpload
                      key={`img-${fieldKey}`}
                      label={t("back.setting.profile.profileImg")}
                      prefix={prefix}
                      filename={!Array.isArray(pictureUrl) ? pictureUrl : null}
                      options={{
                        fileList: Array.isArray(pictureUrl) ? pictureUrl : [],
                        onChange: (newFileList) => {
                          form.setFieldValue(["applicants", parentName, "pictureUrl"], newFileList);
                        },
                      }}
                      uploadText={t("general.uploadImg")}
                    />
                  </Col>
                )}
              </Row>

              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "firstName"]}
                    rules={[{ required: true, message: t("required.firstName") }]}
                    className="!mb-6"
                  >
                    <FloatingLabel
                      label={t("back.reg.form.firstName")}
                      placeholder={t("required.firstName")}
                      required
                      allowClear
                      ref={(el) => {
                        if (el) {
                          nameInputRefs.current[parentName] = el;
                        }
                      }}
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={isMobile ? undefined : { paddingLeft: 24 }}>
                  <CommonForm.Item
                    name={[parentName, "lastName"]}
                    rules={[{ required: true, message: t("required.lastName") }]}
                    className="!mb-6"
                  >
                    <FloatingLabel
                      label={t("back.reg.form.lastName")}
                      placeholder={t("required.lastName")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 8] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "firstNameEn"]}
                    className="
                      !mb-3 sm:!mb-6
                      [&_.ant-form-item-label]:!flex
                      [&_.ant-form-item-label]:!items-start
                      [&_.ant-form-item-label]:!pb-0
                      [&_.ant-form-item-label>label]:!h-auto
                      [&_.ant-form-item-label>label]:!leading-tight
                      [&_.ant-form-item-label>label]:!whitespace-normal
                    "
                    rules={[
                      {
                        required: true,
                        message: t("required.firstNameEn")
                      },
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: t("validation.en"),
                      },
                    ]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.firstNameEn")}
                      placeholder={t("back.reg.form.enterFirstNameEn")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={isMobile ? undefined : { paddingLeft: 24 }}>
                  <CommonForm.Item
                    name={[parentName, "lastNameEn"]}
                    className="!mb-6"
                    rules={[
                      {
                        required: true,
                        message: t("required.lastNameEn")
                      },
                      {
                        pattern: /^[A-Za-z\s]+$/,
                        message: t("validation.en"),
                      },
                    ]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.lastNameEn")}
                      placeholder={t("back.reg.form.enterLastNameEn")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "gender"]}
                    rules={[{ required: true, message: t("required.selectGender") }]}
                    className="!mb-3 sm:!mb-6"
                  >
                    <FloatingLabel
                      type="radio"
                      size="large"
                      optionType="default"
                      label={t("back.reg.form.gender")}
                      required
                      options={[
                        { label: "back.reg.form.male", value: "male" },
                        { label: "back.reg.form.female", value: "female" }
                      ]}
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={isMobile ? undefined : { paddingLeft: 24 }}>
                  <CommonForm.Item
                    name={[parentName, "birthDate"]}
                    rules={[{ required: true, message: t("required.selectBirthDate") }]}
                    className="!mb-6"
                    validateTrigger={["onBlur", "onSubmit"]}
                  >
                    <FloatingLabel
                      type="dateselect"
                      label={t("back.reg.form.birthDate")}
                      required
                      showSearch
                      size="large"
                      className="grid grid-cols-3 gap-2"
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "email"]}
                    className="!mb-6"
                    rules={[
                      { required: true, message: t("required.email") },
                      { type: "email", message: t("validation.email") },
                    ]}
                  >
                    <FloatingLabel
                      type="email"
                      label={t("back.reg.form.email")}
                      placeholder={t("required.email")}
                      required
                      disabled={!fieldKey && type !== "friend"}
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={!isMobile ? { paddingLeft: 24 } : undefined}>
                  <CommonForm.Item
                    name={[parentName, "phone"]}
                    className="!mb-6"
                    rules={[
                      { required: true, message: t("required.phone") },
                      { pattern: /^0\d{9}$/, message: t("validation.phone") },
                    ]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.phone")}
                      placeholder={t("back.reg.form.enterPhone")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "province"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.province") }]}
                  >
                    <FloatingLabel
                      type="select"
                      label={t("back.reg.form.province")}
                      placeholder={t("front.event.selectProvince")}
                      required
                      options={countryStateProvinceOption}
                      disabled={isLoadingProvince}
                      showSearch
                      allowClear
                      filterOption={(input, option) => {
                        const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '');
                        return str.toLowerCase().includes(input.toLowerCase());
                      }}
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={!isMobile ? { paddingLeft: 24 } : undefined}>
                  <CommonForm.Item
                    name={[parentName, "nationality"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.nationality") }]}
                  >
                    <FloatingLabel
                      type="select"
                      label={t("back.reg.form.nationality")}
                      placeholder={t("back.reg.form.selectNationality")}
                      required
                      options={nationalityOption}
                      disabled={isLoadingNationality}
                      showSearch
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "idNo"]}
                    className="!mb-6"
                    rules={[
                      {
                        required: true,
                        message: t("required.idNo"),
                      },
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve();

                          const isIDCard = /^\d{13}$/.test(value);
                          const isPassport = /^[A-Z0-9]{5,20}$/.test(value);

                          if (isIDCard && !validateIDCard(value)) {
                            return Promise.reject(new Error(t("validation.idNo")));
                          }

                          if (!isIDCard && !isPassport) {
                            return Promise.reject(new Error(t("validation.idNoAndPassport")));
                          }

                          return Promise.resolve();
                        },
                      },
                    ]}
                    extra={<span style={{ fontSize: "12px", color: "#999" }}>{t("back.reg.form.passportNote")}</span>}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.idNo")}
                      placeholder={t("back.reg.form.enterIdNo")}
                      required
                      maxLength={20}
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={!isMobile ? { paddingLeft: 24 } : undefined}>
                  <CommonForm.Item
                    name={[parentName, "healthIssues"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.healthIssues") }]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.healthIssues")}
                      placeholder={t("back.reg.form.enterHealthIssues")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "bloodType"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.bloodType") }]}
                  >
                    <FloatingLabel
                      type="select"
                      label={t("back.reg.form.bloodType")}
                      placeholder={t("back.reg.form.selectBloodType")}
                      required
                      options={bloodGroupOption}
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={!isMobile ? { paddingLeft: 24 } : undefined}>
                  <CommonForm.Item
                    name={[parentName, "emergencyContact"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.emergencyContact") }]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.emergencyContact")}
                      placeholder={t("back.reg.form.enterEmergencyContact")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "emergencyRelation"]}
                    className="!mb-6"
                    rules={[{ required: true, message: t("required.emergencyRelation") }]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.emergencyRelation")}
                      placeholder={t("back.reg.form.enterEmergencyRelation")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} sm={24} md={12} style={!isMobile ? { paddingLeft: 24 } : undefined}>
                  <CommonForm.Item
                    name={[parentName, "emergencyPhone"]}
                    className="!mb-6"
                    rules={[
                      { required: true, message: t("required.emergencyPhone") },
                      { pattern: /^0\d{9}$/, message: t("validation.phone") },
                    ]}
                  >
                    <FloatingLabel
                      label={t("back.reg.form.emergencyPhone")}
                      placeholder={t("back.reg.form.enterEmergencyPhone")}
                      required
                      allowClear
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
              <Row gutter={isMobile ? [16, 0] : [16, 16]}>
                <Col xs={24} sm={24} md={12}>
                  <CommonForm.Item
                    name={[parentName, "teamClub"]}
                    className="!mb-6"
                    rules={isTeamEvent ? [{ required: true, message: t("required.teamClub") }] : []}
                  >
                    <FloatingLabel
                      type="autocomplete"
                      size="large"
                      label={t("back.reg.form.teamClub")}
                      placeholder={t("back.reg.form.enterTeamClub")}
                      allowClear
                      required={isTeamEvent}
                      options={mergedTeamClubOptions}
                      filterOption={false}
                      loading={isFetching}
                      onSearch={(text) => setTeamClubSearch(text)}
                      onChange={(val) => {
                        const v = (val ?? "").replace(/\s+/g, " ");
                        form.setFieldValue(["applicants", parentName, "teamClub"], v);
                      }}
                      onSelect={(val) => {
                        const v = (val || "").trim().replace(/\s+/g, " ");
                        form.setFieldValue(["applicants", parentName, "teamClub"], v || undefined);
                        if (v) upsertTeamClub(v);
                      }}
                      onBlur={() => {
                        const raw = form.getFieldValue(["applicants", parentName, "teamClub"]);
                        const v = (raw || "").trim().replace(/\s+/g, " ");
                        form.setFieldValue(["applicants", parentName, "teamClub"], v || undefined);
                        if (v) upsertTeamClub(v);
                      }}
                      onPopupScroll={handleTeamClubPopupScroll}
                      popupRender={(menu) => (
                        <>
                          {menu}
                          {(isFetchingNextPage || isFetching) && (
                            <div className="py-2 text-center">
                              <Spin size="small" />
                            </div>
                          )}
                        </>
                      )}
                    />
                  </CommonForm.Item>
                </Col>
              </Row>
            </div>

            <div className="order-1 flex items-center justify-start mb-2 bg-slate-50 px-4 border border-slate-200 rounded">
              <Divider orientation="left" className="!mb-0 !mt-0">
                {t("back.reg.common.eventType")}
                <Button type="link" onClick={() => handleToggleSection('eventType')}>
                  {eventTypeView ? <UpOutlined /> : <DownOutlined />}
                </Button>
              </Divider>
            </div>
            <div className={`order-2 ${eventTypeView ? "block" : "hidden"}`}>
              <CommonForm.Item
                colon={false}
                name={[parentName, "eventTypeId"]}
                rules={[{ required: true, message: t("required.eventType") }]}
                {...fullWidthItem}
                className="!mb-6 sm:!mb-3"
              >
                <FloatingLabel
                  type="select"
                  label={t("back.reg.common.type")}
                  placeholder={t("required.eventType")}
                  required
                  loading={checkingQuota || loadingAvailability}
                  options={eventTypeOptions}
                  onOpenChange={handleDropdownOpen}
                  onChange={(value) => {
                    if (value) {
                      handleEventTypeChange(value);
                    } else {
                      const current = form.getFieldValue(["applicants", parentName]);

                      const updated = {
                        ...current,
                        eventTypeId: undefined,
                        eventDate: undefined,
                        eventName: undefined,
                        eventTypeName: undefined,
                        price: undefined,
                        pricingOptionId: undefined,
                        paymentName: undefined,
                      };
                      form.setFieldValue(["applicants", parentName], updated);
                      setQuotaAvailable(true);
                    }
                  }}
                  allowClear
                />
              </CommonForm.Item>
              {eventTypeId && !quotaAvailable && (
                <CommonForm.Item
                  colon={false}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <Alert
                    message={t('back.reg.common.quotaFullWarning')}
                    description={t('back.reg.common.quotaFullDescription')}
                    type="warning"
                    showIcon
                    closable
                  />
                </CommonForm.Item>
              )}
              {birthDate && gender && validateAgeGroup?.status !== 'incomplete' ? (
                <CommonForm.Item
                  colon={false}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <Alert
                    style={{ minHeight: 40, padding: "4px 8px", display: "flex", alignItems: "center" }}
                    message={
                      validateAgeGroup.status === 'noAgeGroups'
                        ? t("back.reg.form.noAgeGroup", {
                          age: validateAgeGroup.age,
                          gender: (gender === "male" ? t("back.reg.form.male") : t("back.reg.form.female")).toLowerCase(),
                        })
                        : validateAgeGroup.status === 'valid'
                          ? (() => {
                            const { minAge, maxAge } = validateAgeGroup.matched;
                            const genderText = (gender === "male" ? t("back.reg.form.male") : t("back.reg.form.female")).toLowerCase();

                            if (maxAge === null) {
                              return t("back.reg.form.inAgeGroupMinUp", {
                                age: validateAgeGroup.age,
                                min: minAge,
                                gender: genderText,
                              });
                            } else if (minAge === null) {
                              return t("back.reg.form.inAgeGroupMaxDown", {
                                age: validateAgeGroup.age,
                                max: maxAge,
                                gender: genderText,
                              });
                            } else {
                              return t("back.reg.form.inAgeGroup", {
                                age: validateAgeGroup.age,
                                min: minAge,
                                max: maxAge,
                                gender: genderText,
                              });
                            }
                          })()
                          : t("back.reg.form.notInAgeGroup", {
                            age: validateAgeGroup.age,
                            gender: (gender === "male" ? t("back.reg.form.male") : t("back.reg.form.female")).toLowerCase(),
                          })
                    }
                    type={validateAgeGroup.status === 'noAgeGroups' ? "info" : validateAgeGroup.status === 'valid' ? "success" : "error"}
                    showIcon
                  />
                </CommonForm.Item>
              ) : null}

              {(() => {
                const eventTypeFields = selectedEventType?.selectionFields || [];
                const globalFields = event?.selectionFields || [];
                const allFields = [...globalFields, ...eventTypeFields];

                if (allFields.length === 0) return null;

                const currentLang = i18n.language?.toLowerCase() || "th";

                return (
                  <div className="flex flex-col gap-3 mb-4">
                    {allFields.map((field, index) => {
                      const questionLabel =
                        currentLang === "en" ? field.titleEn || field.title : field.title;

                      const rules = field.required
                        ? [{ required: true, message: t("required.selectionField", { title: questionLabel }) }]
                        : [];

                      const fixedOptions = (field.options || []).filter(opt => opt.inputType !== "FREE_TEXT");
                      const freeTextOption = (field.options || []).find(opt => opt.inputType === "FREE_TEXT");

                      const options = fixedOptions.map((opt) => ({
                        value: opt.id,
                        label: currentLang === "en" ? opt.valueEn || opt.value : opt.value,
                      }));

                      /* ─── MULTIPLE choice ─── */
                      if (field.type === "MULTIPLE") {
                        const freeTextOptions = (field.options || []).filter(opt => opt.inputType === "FREE_TEXT");
                        const freeTextOptionIds = new Set(freeTextOptions.map(o => o.id));

                        return (
                          <div
                            key={`selection-${parentName}-${index}`}
                            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-sm font-semibold text-gray-800 leading-snug">
                                {questionLabel}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                              </span>
                            </div>

                            <CommonForm.Item
                              name={[parentName, "selectionAnswers", field.id, "selected"]}
                              className="!mb-0"
                              rules={rules}
                            >
                              <Checkbox.Group className="!flex !flex-col gap-2 w-full">
                                {(field.options || []).map((option, idx) => {
                                  const optLabel = currentLang === "en"
                                    ? option.valueEn || option.value
                                    : option.value;
                                  const isFreeText = freeTextOptionIds.has(option.id);

                                  return (
                                    <div key={`sel-${parentName}-${index}-${idx}`}>
                                      <label className="qa-option-card">
                                        <Checkbox value={option.id} className="!mr-0" />
                                        <span className="text-sm text-gray-700 leading-snug select-none flex-1">
                                          {optLabel}
                                        </span>
                                      </label>
                                      {isFreeText && (
                                        <CommonForm.Item
                                          noStyle
                                          shouldUpdate={(prev, cur) => {
                                            const prevVal = prev?.applicants?.[parentName]?.selectionAnswers?.[field.id]?.selected;
                                            const curVal = cur?.applicants?.[parentName]?.selectionAnswers?.[field.id]?.selected;
                                            return JSON.stringify(prevVal) !== JSON.stringify(curVal);
                                          }}
                                        >
                                          {({ getFieldValue }) => {
                                            const selectedValues = getFieldValue(["applicants", parentName, "selectionAnswers", field.id, "selected"]) || [];
                                            if (!Array.isArray(selectedValues) || !selectedValues.includes(option.id)) return null;
                                            const placeholder = currentLang === "en"
                                              ? option.valueEn || option.value || t("back.event.form.enterText")
                                              : option.value || t("back.event.form.enterText");
                                            return (
                                              <div className="mt-1.5 ml-9 mr-1 mb-1">
                                                <CommonForm.Item
                                                  name={[parentName, "selectionAnswers", field.id, "freeTextValues", option.id]}
                                                  colon={false}
                                                  className="!mb-0"
                                                  rules={field.required ? [{ required: true, message: t("required.freeTextAnswer") }] : []}
                                                >
                                                  <FloatingLabel
                                                    label={optLabel}
                                                    placeholder={placeholder}
                                                    required={field.required}
                                                    allowClear
                                                  />
                                                </CommonForm.Item>
                                              </div>
                                            );
                                          }}
                                        </CommonForm.Item>
                                      )}
                                    </div>
                                  );
                                })}
                              </Checkbox.Group>
                            </CommonForm.Item>
                          </div>
                        );
                      }

                      /* ─── SINGLE with FREE_TEXT option ─── */
                      if (freeTextOption) {
                        const freeTextPlaceholder = currentLang === "en"
                          ? freeTextOption.valueEn || freeTextOption.value || t("back.event.form.enterText")
                          : freeTextOption.value || t("back.event.form.enterText");

                        return (
                          <div
                            key={`selection-${parentName}-${index}`}
                            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                          >
                            <div className="flex items-start gap-2 mb-3">
                              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-sm font-semibold text-gray-800 leading-snug">
                                {questionLabel}
                                {field.required && <span className="text-red-500 ml-0.5">*</span>}
                              </span>
                            </div>

                            <CommonForm.Item
                              name={[parentName, "selectionAnswers", field.id, "selected"]}
                              colon={false}
                              className="!mb-0"
                              rules={field.required ? [{ required: true, message: t("required.selectionField", { title: questionLabel }) }] : []}
                            >
                              <FloatingLabel
                                type="select"
                                label={questionLabel}
                                placeholder={questionLabel}
                                required={field.required}
                                options={[
                                  ...options,
                                  { value: freeTextOption.id, label: `${currentLang === "en" ? freeTextOption.valueEn || freeTextOption.value || t("back.event.form.other") : freeTextOption.value || t("back.event.form.other")}` }
                                ]}
                                allowClear
                                showSearch
                              />
                            </CommonForm.Item>
                            <CommonForm.Item
                              noStyle
                              shouldUpdate={(prev, cur) => {
                                const prevVal = prev?.applicants?.[parentName]?.selectionAnswers?.[field.id]?.selected;
                                const curVal = cur?.applicants?.[parentName]?.selectionAnswers?.[field.id]?.selected;
                                return prevVal !== curVal;
                              }}
                            >
                              {({ getFieldValue }) => {
                                const selectedValue = getFieldValue(["applicants", parentName, "selectionAnswers", field.id, "selected"]);
                                if (selectedValue === freeTextOption.id) {
                                  return (
                                    <div className="mt-3">
                                      <CommonForm.Item
                                        name={[parentName, "selectionAnswers", field.id, "freeText"]}
                                        colon={false}
                                        className="!mb-0"
                                        rules={field.required ? [{ required: true, message: t("required.freeTextAnswer") }] : []}
                                      >
                                        <FloatingLabel
                                          label={t("back.event.form.enterText")}
                                          placeholder={freeTextPlaceholder}
                                          required={field.required}
                                          allowClear
                                        />
                                      </CommonForm.Item>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            </CommonForm.Item>
                          </div>
                        );
                      }

                      /* ─── SINGLE plain (no free text) ─── */
                      return (
                        <div
                          key={`selection-${parentName}-${index}`}
                          className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm"
                        >
                          <div className="flex items-start gap-2 mb-3">
                            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                              {index + 1}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 leading-snug">
                              {questionLabel}
                              {field.required && <span className="text-red-500 ml-0.5">*</span>}
                            </span>
                          </div>

                          <CommonForm.Item
                            name={[parentName, "selectionAnswers", field.id]}
                            colon={false}
                            className="!mb-0"
                            rules={rules}
                          >
                            <FloatingLabel
                              type="select"
                              label={questionLabel}
                              placeholder={questionLabel}
                              required={field.required}
                              options={options}
                              allowClear
                              showSearch
                            />
                          </CommonForm.Item>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {(eventTypeId && (price || price === 0)) ?
                <CommonForm.Item
                  colon={false}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <div
                    style={{
                      background: "#E6F4FF",
                      border: "1px solid #91CAFF",
                      borderRadius: 4,
                      minHeight: 40,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      padding: "8px 12px",
                    }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-gray-500 text-xs">{t("back.reg.common.price")}</span>
                        <div className="text-lg font-semibold text-blue-600">
                          {price.toLocaleString()} {t("front.eventDetail.baht")}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {paymentName && (
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium ${paymentName === 'Standard'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-orange-100 text-orange-700'
                              }`}
                          >
                            {paymentName}
                          </div>
                        )}
                      </div>
                    </div>
                    {pricingStartDate && pricingEndDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {dayjs(pricingStartDate).format("D MMM YYYY")} - {dayjs(pricingEndDate).format("D MMM YYYY")}
                      </div>
                    )}
                  </div>
                </CommonForm.Item>
                : null}

              {!!event?.shirtTypes?.length && selectedEventType?.discountNoShirt > 0 && (
                <CommonForm.Item
                  colon={false}
                  name={[parentName, "noShirt"]}
                  rules={[{ required: true, message: t("required.shirtOption") }]}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <FloatingLabel
                    type="select"
                    label={t("back.reg.payment.raceShirt")}
                    placeholder={t("required.shirtOption")}
                    required
                    onChange={(value) => {
                      const discount = selectedEventType?.discountNoShirt || 0;
                      const finalPrice = value ? price - discount : price;
                      const current = form.getFieldValue(["applicants", parentName]);

                      const updated = {
                        ...current,
                        noShirt: value,
                        discountNoShirt: value ? discount : 0,
                        finalPrice,
                        ...(value && {
                          shirtTypeId: undefined,
                          shirtSizeId: undefined,
                        }),
                      };

                      form.setFieldValue(["applicants", parentName], updated);
                    }}
                    options={[
                      { value: false, label: t("back.reg.payment.receive") },
                      {
                        value: true,
                        label: `${t("back.reg.payment.noReceive")}${selectedEventType?.discountNoShirt
                          ? ` (${t("back.reg.common.discount")} ${selectedEventType.discountNoShirt.toFixed(2)} ${t("general.unitBaht")})`
                          : ""
                          }`,
                      },
                    ]}
                  />
                </CommonForm.Item>
              )}

              {!!event?.shirtTypes?.length && (selectedEventType?.discountNoShirt === null || noShirt === false) ? (
                <CommonForm.Item
                  colon={false}
                  name={[parentName, "shirtTypeId"]}
                  rules={[{ required: true, message: t("required.shirtType") }]}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <FloatingLabel
                    type="select"
                    label={t("back.reg.payment.shirtType")}
                    placeholder={t("back.reg.payment.selectShirtType")}
                    required
                    options={event?.shirtTypes?.map((shirt) => ({
                      value: shirt.id,
                      label: shirt.name
                    }))}
                    onChange={handleShirtTypeChange}
                  />
                </CommonForm.Item>
              ) : null}

              {!!event?.shirtTypes?.length && (selectedEventType?.discountNoShirt === null || noShirt === false) ? (
                <CommonForm.Item
                  colon={false}
                  name={[parentName, "shirtSizeId"]}
                  rules={[{ required: true, message: t("required.shirtSize") }]}
                  {...fullWidthItem}
                  className="!mb-6 sm:!mb-3"
                >
                  <FloatingLabel
                    type="select"
                    label={t("back.reg.payment.shirtSize")}
                    placeholder={t("back.reg.payment.selectShirtSize")}
                    required
                    options={event?.shirtTypes?.find(type => type.id == shirtTypeId)?.shirtSizes?.map((size) => ({
                      value: size.id,
                      label: `${size.name}${(size.chestSize || size.lengthSize) ? ` ${t("back.reg.payment.chestSize")} : ${size.chestSize || "-"} ${t("back.reg.payment.lengthSize")} : ${size.lengthSize || "-"}` : ''}`
                    }))}
                    onChange={handleShirtSizeChange}
                  />
                </CommonForm.Item>
              ) : null}
            </div>

            <div className="order-5 flex items-center justify-start mb-2 bg-slate-50 px-4 border border-slate-200 rounded">
              <Divider orientation="left" className="!mb-0 !mt-0">
                {t("back.reg.payment.method")}
                <Button type="link" onClick={() => handleToggleSection('payment')}>
                  {paymentView ? <UpOutlined /> : <DownOutlined />}
                </Button>
              </Divider>
            </div>
            <div className={`order-6 ${paymentView ? "block" : "hidden"}`}>
              <CommonForm.Item
                colon={false}
                name={[parentName, "deliveryMethod"]}
                rules={[{ required: true, message: t("back.reg.payment.selectMethodShipping") }]}
                {...fullWidthItem}
              >
                <FloatingLabel
                  type="select"
                  label={t("back.reg.payment.method")}
                  placeholder={t("back.reg.payment.selectMethodShipping")}
                  required
                  options={[
                    ...(event?.shippingFee != null ? [{
                      value: "post",
                      label: event.shippingFee === 0
                        ? `${t("back.reg.payment.post")} ${t("back.reg.payment.free")}`
                        : `${t("back.reg.payment.post")} ( ${event.shippingFee} ${t("general.unitBaht")} )`
                    }] : []),
                    {
                      value: "pickup",
                      label: `${t("back.reg.payment.pickupDate")}${t("back.reg.payment.location")}`
                    }
                  ]}
                  onChange={(value) => {
                    const current = form.getFieldValue(["applicants", parentName]);
                    const updated = {
                      ...current,
                      deliveryMethod: value,
                      shippingFee: value === "post" ? event?.shippingFee : 0,
                      isSameAddress: !!fieldKey,
                    };
                    form.setFieldValue(["applicants", parentName], updated);
                  }}
                />
              </CommonForm.Item >
              {(deliveryMethod === "post") ?
                <>
                  <Divider orientation="left">{t("back.reg.payment.shippingAddress")}</Divider>
                  {fieldKey ? (
                    <CommonForm.Item name={[parentName, "isSameAddress"]}>
                      <Radio.Group
                        onChange={() => {
                          const current = form.getFieldValue(["applicants", parentName]);

                          const updated = {
                            ...current,
                            shippingAddress: null,
                            shippingProvince: null,
                            shippingAmphoe: null,
                            shippingDistrict: null,
                            shippingZipcode: null,
                          };

                          form.setFieldValue(["applicants", parentName], updated);
                        }}
                      >
                        <Radio.Button value={true}>{t("back.reg.payment.sameAddress")}</Radio.Button>
                        <Radio.Button value={false}>{t("back.reg.payment.editAddress")}</Radio.Button>
                      </Radio.Group>
                    </CommonForm.Item>
                  ) : null}
                  {fieldKey && isSameAddress ? (
                    <Row gutter={[16, 16]}>
                      <Col xs={24}>
                        <CommonForm.Item
                          colon={false}
                          name={[parentName, "existingAddress"]}
                          labelCol={labelCol}
                          wrapperCol={wrapperCol}
                          rules={
                            deliveryMethod === "post" && fieldKey && isSameAddress
                              ? [{ required: true, message: t("back.reg.payment.selectAddressPlaceholder") }]
                              : []
                          }
                        >
                          <FloatingLabel
                            type="select"
                            label={t("back.reg.payment.selectAddress")}
                            placeholder={t("back.reg.payment.selectAddressPlaceholder")}
                            options={addressGroups.map((group) => ({
                              value: group.shippingAddress,
                              label: group.shippingAddress
                            }))}
                            onChange={handleAddressChange}
                            onClick={updateAddressGroups}
                          />
                        </CommonForm.Item>
                      </Col>
                    </Row>
                  ) : null}
                  {!fieldKey || !isSameAddress ?
                    <>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={24}>
                          <CommonForm.Item
                            colon={false}
                            name={[parentName, "shippingAddress"]}
                            {...fullWidthItem}
                            className="!mb-6"
                            rules={
                              mustFillShipping
                                ? [{ required: true, message: t("back.reg.payment.enterAddress") }]
                                : []
                            }
                          >
                            <FloatingLabel
                              label={t("back.reg.payment.address")}
                              placeholder={t("back.reg.payment.enterAddress")}
                              allowClear
                            />
                          </CommonForm.Item>
                        </Col>
                      </Row>

                      <ProvinceSelector
                        form={form}
                        basePath={["applicants", parentName]}
                        nameBasePath={[parentName]}
                        compact
                        fieldNames={{
                          zipcode: "shippingZipcode",
                          province: "shippingProvince",
                          amphoe: "shippingAmphoe",
                          district: "shippingDistrict",
                        }}
                        valueMode={{
                          province: "nameTh",
                          amphoe: "nameTh",
                          district: "nameTh",
                        }}
                        required={mustFillShipping}
                        labels={{
                          zipcode: t("back.reg.payment.zipcode"),
                          province: t("back.reg.payment.province"),
                          amphoe: t("back.reg.payment.amphoe"),
                          district: t("back.reg.payment.district"),
                        }}
                      />
                    </> : null
                  }
                </> : null
              }
            </div>
          </div>
        )}
      </div >
    </>
  );
});

export default ApplicantCard;
