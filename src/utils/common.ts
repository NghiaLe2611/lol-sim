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

/** Case-insensitive prefix match on a single display name (e.g. champion `name`). */
export function matchesDisplayNamePrefix(qRaw: string, displayName: string): boolean {
	const q = qRaw.trim().toLowerCase();
	if (!q) return true;
	return displayName.toLowerCase().startsWith(q);
}
