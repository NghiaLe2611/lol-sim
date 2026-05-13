import { apiUrl } from '@/constants/common';

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

export { getChampionDetail, getChampions, getItems, getRunes, getSummonerSpells, getVersions };
