import React, { useEffect, useState } from 'react';
import { Button, Input, Space, Skeleton, Table, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import generalService from 'services/general.services';
import { EMPTY_DESCRIPTION } from 'constants/emptyDescription';
import { handleQueryStatus } from 'utils';

const TableCustom = ({ id, title = null, pathKey, path, columns, eventName, gender, ageGroup, searchColumn, search, favoriteData }) => {
  const [order, setOrder] = useState('asc');
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [page, setPage] = useState(1);
  const [limitPage, setLimitPage] = useState(5);
  const [dataSource, setDataSource] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [sortedField, setSortedField] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const { data, refetch: refetchData, isFetching: isLoadingData, ...other } = generalService.useQueryGetDataTable({
    queryTable: {
      id,
      eventName, gender, ageGroup,
      favorites: isFavorite ? "'" + favoriteData.join("','") + "'" : "",
      paging: {
        sort: order,
        field: sortedField,
        limit: limitPage,
        start: page * limitPage - limitPage,
        searchField: searchColumn ? searchColumn : searchedColumn,
        searchText: search ? "%" + search + "%" : (searchText != "" && searchText != undefined) ? "%" + searchText + "%" : undefined,
      },
    },
    pathKey,
    path
  });

  useEffect(() => {
    handleQueryStatus(other, () => {
      const mappedData = data?.records?.map(item => ({
        ...item,
        pos: gender == '' ? item.pos : item.genderPos
      }));
      setDataSource(mappedData)
      setTotalData(data?.hits || 0)
    })
  }, [other.fetchStatus]);

  useEffect(() => {
    refetchData();
  }, [page]);

  useEffect(() => {
    refetchData();
  }, [sortedField, order]);

  const handleChange = (pagination, filters, sorter) => {
    if (sorter.field === 'favorite') {
      setIsFavorite(!isFavorite);
    } else {
      setOrder(sorter.order == 'descend' ? 'desc' : 'asc')
      setSortedField(sorter.field)
    }
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
      {isLoadingData ? (
        <Skeleton className="center" />
      ) : (
        (totalData > 0) ? (
          <>
            {title != null && (
              <div className="text-sm md:text-base font-semibold opacity-80 mt-8">
                {title}
              </div>
            )}
            <Table
              className="!w-full !text-nowrap"
              columns={columns.map(column => ({
                ...column,
                ...(column.search && getColumnSearchProps(column.dataIndex))
              }))}
              dataSource={dataSource}
              scroll={{ x: true }}
              pagination={{
                pageSize: limitPage,
                current: page,
                onChange: (page, pageSize) => {
                  setPage(page);
                  setLimitPage(pageSize);
                },
                total: totalData,
                pageSizeOptions: ['5', '10', '20', '50', '100'],
                showSizeChanger: true
              }}
              onChange={handleChange}
            />
          </>
        ) :
          ((eventName !== '' && eventName !== null) && (
            <div className="w-full center p-4">
              <Empty description={EMPTY_DESCRIPTION} />
            </div>)
          )
      )}
    </>
  );
}

export default TableCustom;