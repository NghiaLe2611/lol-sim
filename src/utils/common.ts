export function formatNumber(value: number) {
	return value.toLocaleString(undefined, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	});
}

export function capitalizeText(text: string) {
	return text
		.split(' ')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
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

/**
 * Lower = better match. Used to sort autocomplete / search results.
 * 0 name starts with query · 1 word starts with query · 2+ substring (earlier index wins).
 */
export function rankDisplayNameSearch(qRaw: string, displayName: string): number | null {
	const q = qRaw.trim().toLowerCase();
	if (!q) return null;
	const label = displayName.toLowerCase();
	if (label.startsWith(q)) return 0;
	if (label.split(/\s+/).some((word) => word.startsWith(q))) return 1;
	const idx = label.indexOf(q);
	if (idx === -1) return null;
	return 2 + idx;
}

/** Case-insensitive substring match. */
export function matchesDisplayNameIncludes(qRaw: string, displayName: string): boolean {
	return rankDisplayNameSearch(qRaw, displayName) != null;
}
