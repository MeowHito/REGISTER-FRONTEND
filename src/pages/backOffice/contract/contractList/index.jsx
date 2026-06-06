import React, { useEffect, useState } from 'react';
import { Input, Button, Space, Spin, message } from 'antd';
import { FileTextOutlined, FormOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Highlighter from 'react-highlight-words';
import Contract from '../contractInfoForm';
import UseModalHook from 'hooks/useModalHook';
import backOfficeServices from 'services/backoffice.services';
import ContractForm from '../contractForm';
import ContractSignature from '../contractSignature';
import dayjs from 'dayjs';
import { AlertConfirm, AlertError } from 'components/alert';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { SYS_DATE_FORMAT } from 'constants/helper';
import useMe from 'hooks/useMe';
import PermissionActionTable from 'components/permissionActionTable';

const ContractList = () => {
    const { t } = useTranslation();
    const [mode, setMode] = useState(null);
    const [editContract, setEditContract] = useState(null);
    const [contractData, setContractData] = useState([]);
    const [totalData, setTotalData] = useState(0);
    const [order, setOrder] = useState('asc');
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState(undefined);
    const [limitPage, setLimitPage] = useState(10);
    const [page, setPage] = useState(1);
    const [sortedField, setSortedField] = useState(undefined);

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    const {
        open: openContract,
        handleOpen: handleOpenContract,
        handleClose: handleCloseContract,
    } = UseModalHook();

    const {
        open: openContractForm,
        handleOpen: handleOpenContractForm,
        handleClose: handleCloseContractForm,
    } = UseModalHook();
    const {
        open: openContractSignature,
        handleOpen: handleOpenContractSignature,
        handleClose: handleCloseContractSignature,
    } = UseModalHook();

    const { refetch: refetchContract, isFetching: isLoadingData, data: dataContract } = backOfficeServices.useQueryGetAllContract({
        paging: {
            page: page - 1,
            size: limitPage,
            sortField: sortedField,
            sortDirection: order,
            searchField: searchedColumn,
            searchText: (searchText != "" && searchText != undefined) ? "%" + searchText + "%" : undefined,
        },
    });

    const { mutate: deleteContract } = backOfficeServices.useMutationDeleteContract(
        () => {
            message.success(t("general.alertSuccess"));
            refetchContract();
        },
        (err) => {
            AlertError({ text: errorToMessage(err) });
        }
    );

    useEffect(() => {
        if (dataContract?.content?.length > 0) {
            setContractData(dataContract.content)
            setTotalData(dataContract.totalElements);
        } else {
            setContractData([])
            setTotalData(0);
        }
    }, [dataContract]);

    const handleContractFormRowClick = (record) => {
        setEditContract({
            ...record,
        });
        setMode("edit")
        handleOpenContractForm();
    };

    const handleContractSignatureClick = (record) => {
        setEditContract({
            ...record,
        });
        setMode("edit")
        handleOpenContractSignature();
    };

    const handleDelete = (id) => {
        AlertConfirm({
            text: t("general.deleteConfirm"),
            onOk: () => {
                deleteContract({ id });
            },
        });
    };

    const columns = [
        {
            title: t("back.contractList.no"),
            key: "index",
            align: "center",
            render: (_text, _record, index) => {
                return totalData - (page - 1) * limitPage - index;
            }
        },
        {
            title: t("back.contractList.runNo"),
            dataIndex: 'runNo',
            key: 'runNo',
            fixed: "left",
        },
        {
            title: t("back.contractList.eventName"),
            dataIndex: 'eventName',
            key: 'eventName',
            width: 160,
            render: (text) => (
                <div style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                    {text}
                </div>
            ),
        },
        {
            title: t("back.contractList.organizerName"),
            dataIndex: 'organizerName',
            key: 'organizerName',
        },
        {
            title: t("back.contractList.email"),
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: t("back.contractList.idNo"),
            dataIndex: 'idNo',
            key: 'idNo',
        },
        {
            title: t("back.contractList.taxNo"),
            dataIndex: 'taxNo',
            key: 'taxNo',
        },
        {
            title: t("back.contractList.accountNo"),
            dataIndex: 'accountNo',
            key: 'accountNo',
        },
        {
            title: t("back.contractList.accountName"),
            dataIndex: 'accountName',
            key: 'accountName',
        },
        {
            title: t("back.contractList.startDate"),
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => date ? dayjs(date).format(SYS_DATE_FORMAT) : "",
        },
        {
            title: t("back.contractList.endDate"),
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => date ? dayjs(date).format(SYS_DATE_FORMAT) : "",
        },
        {
            title: t("back.contractList.tel"),
            dataIndex: 'tel',
            key: 'tel',
        },
    ];

    const handleChange = (pagination, filters, sorter) => {
        setOrder(sorter.order == 'descend' ? 'desc' : 'asc')
        setSortedField(sorter.field)
    };

    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
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
        onFilter: (value, record) =>
            (record[dataIndex]?.toString().toLowerCase() || '').includes(value.toLowerCase()),
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: '#188fff55', padding: 0 }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text.toString()}
                />
            ) : (
                text
            ),
    });

    return (
        <>
            <Spin spinning={isLoadingData}>
                <PermissionActionTable
                    rowKey="id"
                    className="w-full !text-nowrap"
                    columns={columns.map(column => ({
                        ...column,
                        ...(column.search && getColumnSearchProps(column.dataIndex))
                    }))}
                    dataSource={contractData}
                    bordered
                    scroll={{ x: "max-content" }}
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
                    rawId="contractList"
                    totalText={t("back.contractList.allContracts")}
                    totalData={totalData}
                    createButtonText={t("back.contractList.buttonContract")}
                    onCreate={roleUser === "admin" ?
                        () => {
                            setEditContract(null);
                            handleOpenContract();
                            setMode("new");
                        }
                        : undefined
                    }
                    onView={(record) => {
                        setEditContract({ ...record });
                        setMode("view")
                        handleOpenContract();
                    }}
                    onEdit={(record) => {
                        setEditContract({ ...record });
                        setMode("edit")
                        handleOpenContract();
                    }}
                    onDelete={(record) => {
                        handleDelete(record?.id)
                    }}
                    recordPermission={true}
                    extraPosition="start"
                    extraActions={(record) => [
                        (roleUser === "admin" && (
                            <Button
                                variant="link"
                                color="default"
                                icon={<FormOutlined />}
                                onClick={() => {
                                    handleContractFormRowClick(record);
                                }}
                            >
                                {t("back.contractList.buttonContractForm")}
                            </Button>
                        )),
                        !!record?.contractPath && (
                            <Button
                                variant="link"
                                color="default"
                                icon={<FileTextOutlined />}
                                onClick={() => {
                                    handleContractSignatureClick(record);
                                }}
                            >
                                {t("back.contractList.buttonContractDocument")}
                            </Button>
                        )

                    ].filter(Boolean)}
                />
            </Spin>
            <Contract
                isEditable={mode === "new" || mode === "edit"}
                data={editContract}
                open={openContract}
                onOk={handleCloseContract}
                onCancel={handleCloseContract}
                refetch={refetchContract}
                mode={mode}
            />
            <ContractForm
                data={editContract}
                open={openContractForm}
                onCancel={handleCloseContractForm}
                refetch={refetchContract}
            />
            <ContractSignature
                data={editContract}
                open={openContractSignature}
                onCancel={handleCloseContractSignature}
                refetch={refetchContract}
            />
        </>
    );
};

export default ContractList;