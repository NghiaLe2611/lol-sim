import { apiUrl } from '@/constants/common';

function getBonusApiBase(): string {
	const base = import.meta.env.VITE_API_URL as string | undefined;
	if (!base?.trim()) {
		throw new Error('VITE_API_URL is not set');
	}
	return base.replace(/\/$/, '');
}

// Get version list
async function getVersions() {
	const url = `${apiUrl}/api/versions.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data[0]; // latest version
	} catch (error) {
		// console.error('Error fetching versions:', error);
		throw error;
	}
}

// Get champion list
async function getChampions(version: string) {
	const url = `${apiUrl}/cdn/${version}/data/en_US/champion.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		// console.error('Error fetching champions:', error);
		throw error;
	}
}

// Champion detail
async function getChampionDetail(version: string, championId: string) {
	const idEncoded = encodeURIComponent(championId);
	const url = `${apiUrl}/cdn/${version}/data/en_US/champion/${idEncoded}.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		throw error;
	}
}

// Bonus data from merakianalytics
async function getBonusChampions() {
	const url = `${getBonusApiBase()}/champions`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (error) {
		throw error;
	}
}

async function getBonusChampionDetail(championKey: string) {
	const idEncoded = encodeURIComponent(championKey);
	const url = `${getBonusApiBase()}/champions/${idEncoded}`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data as Record<string, unknown>;
	} catch (error) {
		throw error;
	}
}

// Get item list
async function getItems(version: string) {
	const url = `${apiUrl}/cdn/${version}/data/en_US/item.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		// console.error('Error fetching items:', error);
		throw error;
	}
}

async function getBonusItems() {
	const url = `${getBonusApiBase()}/items`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return Array.isArray(data) ? data : [];
	} catch (error) {
		throw error;
	}
}

// Get rune list
async function getRunes(version: string) {
	const url = `${apiUrl}/cdn/${version}/data/en_US/runesReforged.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		// console.error('Error fetching runes:', error);
		throw error;
	}
}

// Get summoner spell list
async function getSummonerSpells(version: string) {
	// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-spells.json
	// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/data/spells/icons2d/
	const url = `${apiUrl}/cdn/${version}/data/en_US/summoner.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		// console.error('Error fetching summoner spells:', error);
		throw error;
	}
}

/*
const MERAKI_ANALYTICS_URL =
	'https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US';

async function getChampionsMeraki() {
	const url = `${MERAKI_ANALYTICS_URL}/champions.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		throw error;
	}
}

async function getChampionDetailMeraki(championId: string) {
	const idEncoded = encodeURIComponent(championId);
	const url = `${MERAKI_ANALYTICS_URL}/champions/${idEncoded}.json`;
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data as Record<string, unknown>;
	} catch (error) {
		throw error;
	}
}
*/

export {
	getBonusChampionDetail,
	getBonusChampions,
	getChampionDetail,
	getChampions,
	getItems,
	getBonusItems,
	getRunes,
	getSummonerSpells,
	getVersions,
};
