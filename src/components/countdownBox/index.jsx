const CountdownBox = ({ value, label }) => {

  return (
    <div className="bg-blue-700 text-white rounded-md p-2 text-center min-w-[55px]">
      <div className="relative h-[24px] overflow-hidden font-mono leading-none">
        <div
          className={"absolute inset-0 flex items-center justify-center text-xl font-bold transition-transform duration-100"}
        >
          {value.toString().padStart(2, "0")}
        </div>
      </div>

      <div className="text-sm mt-1">{label}</div>
    </div>
  );
};

export default CountdownBox;
