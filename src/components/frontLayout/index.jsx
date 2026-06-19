import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MENU } from "constants/front";
import _ from "lodash";
import { Breadcrumb } from 'antd';
import Footer from 'components/footer';

const FrontLayout = ({ title = "title", children, fullWidth = false }) => {
  const [, setTitlePage] = useState(title);
  const [, setMainPage] = useState('');
  const [, setMainName] = useState('');

  const selectedMenuItem = useMemo(() => MENU?.find(e => e.key === title), [title]);
  const mainMenuItem = useMemo(() => selectedMenuItem && MENU?.find(e => e.id === selectedMenuItem.main), [selectedMenuItem]);

  useEffect(() => {
    if (selectedMenuItem) {
      setTitlePage(selectedMenuItem.name);
      if (mainMenuItem) {
        setMainPage(mainMenuItem.path);
        setMainName(mainMenuItem.name);
      }
    }
  }, [selectedMenuItem, mainMenuItem]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-40px)] md:min-h-[calc(100vh-65px)]">
      <main className="flex-1 bg-white">
        <div className="sg-page-content pb-5">
          <div className="sg-section">
            <div className="section-content sg-filter-content grid-view-tab pb-10 bg-white">
              <div className={fullWidth ? "w-full px-4 md:px-8" : "container"}>
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FrontLayout
