import { Select } from "antd";
import _ from "lodash";
import { useEffect, useState } from "react";
import masterService from "services/master.services";
import { handleQueryStatus } from 'utils';

const SelectNationality = ({ ...props }) => {
  const [nationalityOption, setNationalityOption] = useState([]);
  const { data, isFetching, ...other } = masterService.useQueryGetNationality();

  useEffect(() => {
    handleQueryStatus(other, () => {
      let options = _.map(data, (n) => {
        return { value: n.alpha_3_code, label: n.nationality };
      });
      setNationalityOption(options);
    })
  }, [other.fetchStatus])

  return (
    <Select
      showSearch
      disabled={isFetching}
      placeholder="เลือกสัญชาติ"
      size="large"
      options={nationalityOption}
      {...props}
    />
  );
};

export default SelectNationality;
