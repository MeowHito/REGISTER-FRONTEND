import dayjs from "dayjs";

export const formatCurrency = (value) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num) || num === 0) return "-";

    return new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const toStartOfDay = (date, defaultDate = dayjs().startOf('day')) => {
    return date ? dayjs(date).startOf('day') : defaultDate;
};

export const toStartOfDayISO = (date) => {
    if (!date) return null;
    return dayjs(date).startOf('day').toISOString();
};