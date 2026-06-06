import { Select } from "antd";
import { useMemo } from "react";

function RoleSelect({ roles, value, onChange }){

  const groupedOptions = useMemo(() => {
    if (!roles?.content) return [];
    const grouped = {};

    roles.content.forEach(r => {
      if (!grouped[r.roleType]) {
        grouped[r.roleType] = [];
      }
      grouped[r.roleType].push({
        label: r.role, 
        value: r.id,
      });
    });

    return Object.entries(grouped).map(([roleType, options]) => ({
      label: roleType.toUpperCase(),
      options,
    }));
  }, [roles]);

  return (
    <Select
      className="w-full"
      value={value}
      options={groupedOptions}
      onChange={onChange}
      showSearch
      optionFilterProp="label"
    />
  );
};
export default RoleSelect