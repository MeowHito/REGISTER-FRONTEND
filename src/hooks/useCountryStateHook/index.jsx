import _ from "lodash";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import masterService from "services/master.services";
import { countryCodeMap } from "constants/countryCodeMap";


const rawFlags = import.meta.glob('/src/assets/images/flag/*.png', { eager: true, import: 'default' });
const flags = Object.entries(rawFlags).reduce((acc, [path, module]) => {
  const filename = path.split('/').pop();
  const key = filename.split('.')[0]?.toLowerCase();
  acc[key] = module;
  return acc;
}, {});

const useCountryStateHook = (config = {}) => {
  const { labelKey, valueKey } = config;
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language?.toLowerCase();

  const [provinceOption, setProvinceOption] = useState([]);
  const { data: dataSource, isFetching: isLoadingProvince } = masterService.useQueryGetAllCountryState();

  const getLabel = (p) => {
    if (labelKey) return p[labelKey] ?? '';
    return currentLanguage === "th" ? p.stateLocal : p.stateEn;
  };

  const getValue = (p) => {
    if (valueKey) return p[valueKey] ?? '';
    return p.id;
  };

  useEffect(() => {
    if (dataSource) {
      const options = _(dataSource)
        .groupBy(currentLanguage === "th" ? 'countryLocal' : 'countryEn')
        .map((provinces, country) => {
          const code = countryCodeMap[provinces[0]?.countryEn] || '';
          return {
            label: (
              <span>
                {flags[code] && <img src={flags[code]} alt={country} style={{ width: 20, marginRight: 8, verticalAlign: 'middle', display: 'inline-block' }} />}
                {country}
              </span>
            ),
            filterLabel: country,
            options: provinces
              .map(p => ({
                value: getValue(p),
                label: getLabel(p),
              }))
          }
        })
        .value();
      setProvinceOption(options);
    } else {
      setProvinceOption([]);
    }
  }, [dataSource, currentLanguage, labelKey, valueKey]);

  return {
    isLoadingProvince,
    provinceOption,
  };
};
export default useCountryStateHook;
