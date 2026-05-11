export function formatNumber(value: number) {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

export function formatPercentage(value: number) {
    return `${value.toFixed(0)}%`;
}

export function formatDecimal(value: number) {
    return value.toFixed(1);
}

export function formatInteger(value: number) {
    return value.toFixed(0);
}
