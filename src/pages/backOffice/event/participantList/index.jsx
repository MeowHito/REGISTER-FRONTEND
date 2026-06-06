import { SearchOutlined, LeftOutlined, DownloadOutlined, UploadOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Input, message, Select, Space, Spin } from 'antd';
import UseModalHook from 'hooks/useModalHook';
import React, { useEffect, useState } from 'react'
import backOfficeServices from 'services/backoffice.services';
import Highlighter from 'react-highlight-words';
import { AlertError } from 'components/alert';
import Participant from '../participant';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from 'react-responsive';
import ParticipantUpload from '../participantUpload';
import masterService from 'services/master.services';
import fileService from 'services/file.services';
import dayjs from 'dayjs';
import { SYS_DATE_FORMAT } from 'constants/helper';
import { genderOption } from 'constants/options/genderOption';
import { getMenuPermission, handleQueryStatus } from 'utils';
import PermissionActionTable from 'components/permissionActionTable';
import useMe from 'hooks/useMe';

function ParticipantList({ eventId, eventName, setView, eventCanUpdate = true }) {
    const { t } = useTranslation();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const [mode, setMode] = useState(null);
    const [editParticipant, setEditParticipant] = useState(null);
    const [participantData, setParticipantData] = useState([]);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [totalData, setTotalData] = useState(0);
    const [sortedField, setSortedField] = useState(undefined);
    const [eventTypeOption, setEventTypeOption] = useState([]);
    const [eventType, setEventType] = useState(null);
    const [nationalityOption, setNationalityOption] = useState([]);
    const [nationalityValues, setNationalityValues] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const {
        data: me
    } = useMe({ retry: 0 });

    const [menuPerm, setMenuPerm] = useState({
        canRead: false,
        canCreate: false,
        canUpdate: false,
        canDelete: false,
    })

    const {
        open: openCreateParticipantUpload,
        handleOpen: handleOpenCreateParticipantUpload,
        handleClose: handleCloseCreateParticipantUpload,
    } = UseModalHook();
    const {
        open: openCreateParticipant,
        handleOpen: handleOpenCreateParticipant,
        handleClose: handleCloseCreateParticipant,
    } = UseModalHook();

    const { data: eventTypeData } = backOfficeServices.useQueryGetEventTypeByEventId({ eventId });

    const { data: participants, refetch: refetchParticipant, isFetching: isLoadingData, ...otherParticipant } = backOfficeServices.useQueryGetAllParticipant({
        id: eventType,
        paging: {
            page: page - 1,
            size: limitPage,
            sortField: sortedField,
            sortDirection: order,
            searchField: searchedColumn,
            searchText: searchText || undefined,
        }
    });

    const { data: nationalities, isFetching: isLoadingNationality, ...otherNationalities } = masterService.useQueryGetNationality();

    useEffect(() => {
        setMenuPerm(getMenuPermission("eventList", me))
    }, [])

    useEffect(() => {
        if (eventTypeData?.length > 0) {
            const options = eventTypeData?.map(({ name, id }) => ({
                value: id, label: name, id
            })) || [];
            setEventTypeOption(options);

            if (options.length > 0) {
                const { value } = options[0];
                setEventType(value);
            }
        } else {
            setEventTypeOption([])
            setEventType(null);
        }
    }, [eventTypeData])

    useEffect(() => {
        handleQueryStatus(otherParticipant, () => {
            if (participants?.content?.length > 0) {
                setParticipantData(participants.content)
                setTotalData(participants.totalElements);
            } else {
                setParticipantData([])
                setTotalData(0);
            }
        })
    }, [otherParticipant.fetchStatus])

    useEffect(() => {
        handleQueryStatus(otherNationalities, () => {
            if (nationalities?.length > 0) {
                let options = nationalities.map((n) => {
                    return { value: n.alpha_3_code, label: n.nationality };
                });
                setNationalityOption(options);
                setNationalityValues(nationalities?.map((n) => n.alpha_3_code));
            } else {
                setNationalityOption([])
                setNationalityValues([])
            }
        })
    }, [otherNationalities.fetchStatus])

    const handleOk = async (saveData) => {
        const unitNames = {};
        if (eventTypeData) {
            for (const { id, name } of eventTypeData) {
                unitNames[name] = id;
            }
        }

        const thaiToEnglishColumnMapping = {
            "id": "id",
            "หมายเลขออเดอร์": "orderNo",
            "ชื่อ": "firstName",
            "นามสกุล": "lastName",
            "ชื่อ (ภาษาอังกฤษ)": "firstNameEn",
            "นามสกุล (ภาษาอังกฤษ)": "lastNameEn",
            "บัตรประชาชน": "idNo",
            "เพศ": "gender",
            "วันเกิด": "birthDate",
            "สัญชาติ": "nationality",
            "อีเมล": "email",
            "เบอร์โทรศัพท์": "phone",
            "ที่อยู่": "address",
            "จังหวัด": "province",
            "อำเภอ": "amphoe",
            "ตำบล": "district",
            "ไปรษณีย์": "zipcode",
            "หมู่เลือด": "bloodGroup",
            "ปัญหาสุขภาพ": "healthIssues",
            "ผู้ติดต่อฉุกเฉิน": "emergencyContact",
            "เบอร์โทรศัพท์ผู้ติดต่อฉุกเฉิน": "emergencyPhone",
            "ไซส์เสื้อ": "shirtSize",
            "สมัครวันที่": "registerDate",
            "ชื่อทีม": "teamClub",
            "bib": "bibNo",
            "ที่อยู่จัดส่ง": "shippingFullAddress"
        };
        const formattedData = saveData
            ?.filter(((e) => Object.keys(unitNames).includes(e.sheetName)))
            ?.map(({ sheetName, data }) => ({
                id: unitNames[sheetName],
                data: data ? data.map(({ ...rest }) => {
                    const mappedData = {};
                    for (const [thaiColumnName, englishColumnName] of Object.entries(thaiToEnglishColumnMapping)) {
                        mappedData[englishColumnName] = rest[thaiColumnName] || '';
                    }
                    if (mappedData.shippingFullAddress) {
                        const parts = mappedData.shippingFullAddress.split(",");
                        mappedData.shippingAddress = parts[0]?.trim() || "";
                        mappedData.shippingDistrict = parts[1]?.trim() || "";
                        mappedData.shippingAmphoe = parts[2]?.trim() || "";
                        mappedData.shippingProvince = parts[3]?.trim() || "";
                        mappedData.shippingZipcode = parts[4]?.trim() || "";
                    }
                    return {
                        ...mappedData
                    };
                }) : [],
            })) ?? [];
        await backOfficeServices.uploadParticipant(formattedData);
        refetchParticipant();
        handleCloseCreateParticipantUpload();
    };

    const { mutate: participantDownload, isPending: isLoadingParticipantDownload } = fileService.useMutationDownloadParticipant(eventId);

    const handleChange = (pagination, filters, sorter) => {
        const sortField = sorter.field === "registerDate" ? "createdTime" : sorter.field;
        setOrder(sorter.order == 'descend' ? 'desc' : 'asc')
        setSortedField(sortField)
    };

    const handleRowClick = (record) => {
        setEditParticipant({
            ...record,
        });
        setMode("edit")
        handleOpenCreateParticipant();
    };

    const columns = [
        {
            key: 'index',
            width: 50,
            render: (_text, _record, index) => {
                return totalData - ((page - 1) * limitPage) - index;
            }
        },
        {
            title: t("back.event.participant.home.orderNo"),
            dataIndex: 'orderNo',
            key: 'orderNo',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.firstName"),
            dataIndex: 'firstName',
            key: 'firstName',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.lastName"),
            dataIndex: 'lastName',
            key: 'lastName',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.gender"),
            dataIndex: 'gender',
            key: 'gender',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.nationality"),
            dataIndex: 'nationality',
            key: 'nationality',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.bibNo"),
            dataIndex: 'bibNo',
            key: 'bibNo',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.registerDate"),
            dataIndex: 'registerDate',
            key: 'registerDate',
            sorter: true,
            search: false,
            render: (date) => date ? dayjs(date).format(SYS_DATE_FORMAT) : "",
        },
        {
            title: t("back.event.participant.home.teamName"),
            dataIndex: 'teamClub',
            key: 'teamClub',
            sorter: true,
            search: true,
        },
        {
            title: t("back.event.participant.home.shirtSize"),
            dataIndex: 'shirtSizeName',
            key: 'shirtSizeName',
            sorter: true,
            search: true,
        },
    ];

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setPage(1);
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setPage(1);
        setSearchText('');
        setSearchedColumn(undefined);
    };

    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#188fff55', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={String(text ?? "")}
                />
            ) : (
                text ?? ""
            ),
    });

    const { mutateAsync: sendBibByEvent } = backOfficeServices.useMutationSendBibByEvent();

    const handleSendBibEmail = async () => {
        try {
            setIsLoading(true);
            const res = await sendBibByEvent({ id: eventId });
            if (res.success) {
                message.success(t("back.event.participant.home.resultSendBibEmail.success"));
            } else {
                AlertError({
                    text: t("back.event.participant.home.resultSendBibEmail.failed", {
                        reason: res.message
                    })
                });
            }
        } catch (err) {
            console.error("Send Bib Email Error:", err);
            AlertError({
                text: t("back.event.participant.home.resultSendBibEmail.error", {
                    message: err?.response?.data?.message || err,
                }),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const CreateSection = () =>
        <div className="flex flex-col lg:flex-row justify-end gap-1">
            {totalData > 0 && (
                <div className="w-full md:w-auto">
                    <Button
                        type="primary"
                        className="w-full h-full center"
                        icon={<MailOutlined />}
                        onClick={handleSendBibEmail}
                        loading={isLoading}
                    >
                        {t("back.event.participant.home.sendBibEmail")}
                    </Button>
                </div>
            )}
            <div className="w-full md:w-auto">
                <Button
                    type="primary"
                    className="w-full h-full center"
                    icon={<DownloadOutlined />}
                    onClick={() => participantDownload()}
                    loading={isLoadingParticipantDownload}
                >
                    {t("back.event.participant.home.downloadParticipants")}
                </Button>
            </div>
            {
                menuPerm.canUpdate && eventCanUpdate ? <div className="w-full md:w-auto">
                    <Button
                        type="primary"
                        className="w-full h-full center"
                        icon={<UploadOutlined />}
                        onClick={() => {
                            handleOpenCreateParticipantUpload();
                        }}
                    >
                        {t("back.event.participant.home.uploadParticipants")}
                    </Button>
                </div> : null
            }
            <div className="w-[200px]">
                <Select
                    placeholder={t("back.event.participant.home.eventType")}
                    className='w-full'
                    value={eventType}
                    options={eventTypeOption}
                    onChange={(value) => {
                        setEventType(value);
                    }}
                />
            </div>
        </div>

    return (
        <>
            <div className={`mb-4 flex ${isMobile ? 'flex-col items-start' : 'items-center justify-between'}`}>
                <Button
                    type="link"
                    className="center"
                    onClick={() => {
                        setView(null);
                    }}
                >
                    <LeftOutlined size={22} className="me-2" />
                    <p>{t("general.back")}</p>
                </Button>
                <label className="flex-1 text-center text-xl font-semibold opacity-60">
                    {t('back.event.eventPermission.eventName') + ': ' + eventName}
                </label>
            </div>
            <Spin spinning={isLoadingData}>
                <PermissionActionTable
                    className="!w-full !text-nowrap"
                    rowKey="id"
                    columns={columns.map(column => ({
                        ...column,
                        ...(column.search && getColumnSearchProps(column.dataIndex))
                    }))}
                    dataSource={participantData}
                    bordered
                    scroll={{ x: true }}
                    pagination={{
                        pageSize: limitPage,
                        current: page,
                        onChange: (page, pageSize) => {
                            setPage(page);
                            setLimitPage(pageSize);
                        },
                        total: totalData,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showSizeChanger: true
                    }}
                    onChange={handleChange}

                    rawId="eventList"
                    totalText={t("back.event.participant.home.allParticipants")}
                    customCreate={<CreateSection />}
                    onEdit={eventCanUpdate ? (record) => {
                        handleRowClick(record);
                    } : undefined}

                />
            </Spin>
            <ParticipantUpload
                id={eventId}
                open={openCreateParticipantUpload}
                onOk={handleOk}
                onCancel={handleCloseCreateParticipantUpload}
                nationalityValues={nationalityValues}
            />
            <Participant
                isEditable={mode === "new" || mode === "edit"}
                data={editParticipant}
                open={openCreateParticipant}
                onOk={handleCloseCreateParticipant}
                onCancel={handleCloseCreateParticipant}
                refetch={refetchParticipant}
                mode={mode}
                nationalityOption={nationalityOption}
                isLoadingNationality={isLoadingNationality}
                genderOption={genderOption}
            />
        </>
    )
}

export default ParticipantList
