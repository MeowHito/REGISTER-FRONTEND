import React, { useEffect, useState } from 'react';
import { Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import Cookies from "js-cookie";

const rawFlags = import.meta.glob('/src/assets/images/flag/*.png', { eager: true, import: 'default' });

const flags = Object.entries(rawFlags).reduce((acc, [path, module]) => {
  const filename = path.split('/').pop();
  const key = filename.split('.')[0];
  acc[key] = module;
  return acc;
}, {});

const languages = [
  { code: 'en', label: 'English', flagKey: 'us' },
  { code: 'th', label: 'ไทย', flagKey: 'th' },
];

const LanguageSelector = ({ className }) => {
  const { i18n } = useTranslation();

  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const lang = Cookies.get('language')?.toLowerCase();
    return lang || 'th';
  });

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const getFlag = (key) => {
    const result = flags[key];
    return result || null;
  };

  const items = languages.map(lang => ({
    key: lang.code,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img
          src={getFlag(lang.flagKey)}
          alt={`${lang.label} flag`}
          width={20}
          height={14}
          style={{ marginRight: 8 }}
        />
        <span>{lang.label}</span>
      </div>
    ),
  }));

  const handleClick = ({ key }) => {
    setCurrentLanguage(key);
    Cookies.set('language', key);
  };

  useEffect(() => {
    if (currentLanguage !== i18n.language) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage, i18n]);

  return (
    <Dropdown
      menu={{ items, onClick: handleClick }}
      trigger={['click']}
      className={`${className} md:justify-center md:items-center rounded-full bg-white h-8 w-8 border border-gray-300 cursor-pointer`}
    >
      <div className='flex justify-center items-center rounded-full bg-white h-8 w-8'>
        <img
          src={getFlag(currentLang.flagKey)}
          alt={`${currentLang.label} flag`}
          className='rounded-full h-6 w-6'
        />
      </div>
    </Dropdown>
  );
};

export default LanguageSelector;
