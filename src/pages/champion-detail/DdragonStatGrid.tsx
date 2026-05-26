import BonusStatGridCell from '@/pages/champion-detail/BonusStatGridCell';

const DDRAGON_STAT_ROWS: readonly {
	flat: string;
	perLevel?: string;
	statKey: string;
}[] = [
	{ flat: 'hp', perLevel: 'hpperlevel', statKey: 'health' },
	{ flat: 'mp', perLevel: 'mpperlevel', statKey: 'mana' },
	{ flat: 'hpregen', perLevel: 'hpregenperlevel', statKey: 'healthRegen' },
	{ flat: 'mpregen', perLevel: 'mpregenperlevel', statKey: 'manaRegen' },
	{ flat: 'armor', perLevel: 'armorperlevel', statKey: 'armor' },
	{ flat: 'movespeed', statKey: 'movespeed' },
	{ flat: 'spellblock', perLevel: 'spellblockperlevel', statKey: 'magicResistance' },
	{ flat: 'attackrange', statKey: 'attackRange' },
	{ flat: 'attackdamage', perLevel: 'attackdamageperlevel', statKey: 'attackDamage' },
	{ flat: 'attackspeed', perLevel: 'attackspeedperlevel', statKey: 'attackSpeed' },
	{ flat: 'crit', perLevel: 'critperlevel', statKey: 'crit' },
];

export default function DdragonStatGrid({ stats }: { stats: Record<string, number> }) {
	return (
		<div className="grid gap-x-10 sm:grid-cols-2">
			{DDRAGON_STAT_ROWS.map(({ flat, perLevel, statKey }) => {
				const flatVal = stats[flat];
				if (flatVal == null || Number.isNaN(flatVal)) return null;

				const perLevelVal =
					perLevel != null && stats[perLevel] != null && !Number.isNaN(stats[perLevel])
						? stats[perLevel]
						: undefined;

				return (
					<BonusStatGridCell
						key={flat}
						flat={flatVal}
						perLevel={perLevelVal}
						statKey={statKey}
					/>
				);
			})}
		</div>
	);
}
