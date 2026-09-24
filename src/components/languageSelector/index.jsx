import React, { useEffect, useState } from 'react';
import { Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
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

const LanguageSelector = ({ className, variant }) => {
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

  // Back-office header shows a labelled pill ("🌐 TH ไทย") instead of the round flag.
  if (variant === 'pill') {
    return (
      <Dropdown menu={{ items, onClick: handleClick }} trigger={['click']} placement="bottomRight">
        <button
          type="button"
          className={`${className || ''} flex items-center gap-2 h-9 px-3 rounded-full border border-[#d2d2d7] bg-white text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors cursor-pointer`}
        >
          <GlobalOutlined className="text-[15px] text-[#424245]" />
          <span className="font-semibold">{currentLang.code.toUpperCase()}</span>
          <span className="text-[#6e6e73] hidden sm:inline">{currentLang.label}</span>
        </button>
      </Dropdown>
    );
  }

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
