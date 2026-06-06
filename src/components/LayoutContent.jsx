const LayoutContent = ({ children, useContainer = true }) => {
  return (
    <div className="sg-page-content">
      <div className="sg-section">
        <div className="section-content sg-filter-content grid-view-tab pb-10">
          <div className={`${useContainer ? 'container' : ''}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayoutContent;
