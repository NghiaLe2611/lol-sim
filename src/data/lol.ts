export type ChampionStats = {
    hp: number;
    hpperlevel: number;
    mp: number;
    mpperlevel: number;
    movespeed: number;
    armor: number;
    armorperlevel: number;
    spellblock: number;
    spellblockperlevel: number;
    attackrange: number;
    hpregen: number;
    hpregenperlevel: number;
    mpregen: number;
    mpregenperlevel: number;
    crit: number;
    critperlevel: number;
    attackdamage: number;
    attackdamageperlevel: number;
    attackspeed: number;
    attackspeedperlevel: number;
};

export type Spell = {
    key: 'Q' | 'W' | 'E' | 'R';
    name: string;
    description: string;
    cooldown: string;
    cost: string;
    range: string;
    maxRank: number;
};

export type Champion = {
    id: string;
    name: string;
    title: string;
    blurb: string;
    tags: string[];
    partype: string;
    info: { attack: number; defense: number; magic: number; difficulty: number };
    imageUrl: string;
    splashUrl: string;
    stats: ChampionStats;
    passive: { name: string; description: string };
    spells: Spell[];
};

const ddragonImg = (id: string) =>
    `https://ddragon.leagueoflegends.com/cdn/16.9.1/img/champion/${id}.png`;
const splash = (id: string) =>
    `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${id}_0.jpg`;

export const champions: Champion[] = [
    {
        id: 'Aatrox',
        name: 'Aatrox',
        title: 'the Darkin Blade',
        blurb: 'Once honored defenders of Shurima against the Void, Aatrox and his brethren would eventually become an even greater threat to Runeterra, defeated only by cunning mortal sorcery.',
        tags: ['Fighter', 'Tank'],
        partype: 'Blood Well',
        info: { attack: 8, defense: 4, magic: 3, difficulty: 4 },
        imageUrl: ddragonImg('Aatrox'),
        splashUrl: splash('Aatrox'),
        stats: {
            hp: 650,
            hpperlevel: 114,
            mp: 0,
            mpperlevel: 0,
            movespeed: 345,
            armor: 38,
            armorperlevel: 4.8,
            spellblock: 32,
            spellblockperlevel: 2.05,
            attackrange: 175,
            hpregen: 3,
            hpregenperlevel: 0.5,
            mpregen: 0,
            mpregenperlevel: 0,
            crit: 0,
            critperlevel: 0,
            attackdamage: 60,
            attackdamageperlevel: 0,
            attackspeed: 0.651,
            attackspeedperlevel: 2.5,
        },
        passive: {
            name: 'Deathbringer Stance',
            description:
                "Periodically, Aatrox's next basic attack deals bonus physical damage and heals him based on the target's max HP.",
        },
        spells: [
            {
                key: 'Q',
                name: 'The Darkin Blade',
                description:
                    'Aatrox slams his greatsword, dealing physical damage. He can recast this ability twice, with each recast hitting a different area.',
                cooldown: '14/12/10/8/6',
                cost: '0',
                range: '650',
                maxRank: 5,
            },
            {
                key: 'W',
                name: 'Infernal Chains',
                description:
                    'Aatrox smashes the ground, dealing damage and slowing the first enemy hit. Champions and large monsters have to leave the impact area or be pulled back.',
                cooldown: '20/18/16/14/12',
                cost: '0',
                range: '825',
                maxRank: 5,
            },
            {
                key: 'E',
                name: 'Umbral Dash',
                description:
                    'Passively, Aatrox heals when damaging enemy champions. On activation, he dashes in a direction.',
                cooldown: '9/8/7/6/5',
                cost: '0',
                range: '300',
                maxRank: 5,
            },
            {
                key: 'R',
                name: 'World Ender',
                description:
                    'Aatrox unleashes his demonic form, fearing nearby minions and gaining attack damage, increased healing, and movement speed.',
                cooldown: '120/100/80',
                cost: '0',
                range: 'Self',
                maxRank: 3,
            },
        ],
    },
    {
        id: 'Ahri',
        name: 'Ahri',
        title: 'the Nine-Tailed Fox',
        blurb: 'Innately connected to the magic of the spirit realm, Ahri is a vastaya who can reshape magic into orbs of raw energy.',
        tags: ['Mage', 'Assassin'],
        partype: 'Mana',
        info: { attack: 3, defense: 4, magic: 8, difficulty: 5 },
        imageUrl: ddragonImg('Ahri'),
        splashUrl: splash('Ahri'),
        stats: {
            hp: 590,
            hpperlevel: 104,
            mp: 418,
            mpperlevel: 25,
            movespeed: 330,
            armor: 21,
            armorperlevel: 4.7,
            spellblock: 30,
            spellblockperlevel: 1.3,
            attackrange: 550,
            hpregen: 2.5,
            hpregenperlevel: 0.6,
            mpregen: 8,
            mpregenperlevel: 0.8,
            crit: 0,
            critperlevel: 0,
            attackdamage: 53,
            attackdamageperlevel: 3,
            attackspeed: 0.668,
            attackspeedperlevel: 2.0,
        },
        passive: {
            name: 'Essence Theft',
            description:
                "After killing 9 minions or monsters, Ahri's next damaging spell hit will heal her.",
        },
        spells: [
            {
                key: 'Q',
                name: 'Orb of Deception',
                description:
                    'Ahri sends out and pulls back her orb, dealing magic damage on the way out and true damage on the way back.',
                cooldown: '7',
                cost: '65/70/75/80/85',
                range: '880',
                maxRank: 5,
            },
            {
                key: 'W',
                name: 'Fox-Fire',
                description:
                    'Ahri releases three fox-fires that lock onto and attack nearby enemies.',
                cooldown: '9/8/7/6/5',
                cost: '40',
                range: '725',
                maxRank: 5,
            },
            {
                key: 'E',
                name: 'Charm',
                description:
                    'Ahri blows a kiss that damages and charms an enemy, causing them to walk harmlessly toward her.',
                cooldown: '12',
                cost: '85',
                range: '975',
                maxRank: 5,
            },
            {
                key: 'R',
                name: 'Spirit Rush',
                description:
                    'Ahri dashes forward and fires essence bolts. Spirit Rush can be cast up to three times before going on cooldown.',
                cooldown: '130/115/100',
                cost: '100',
                range: '450',
                maxRank: 3,
            },
        ],
    },
    {
        id: 'Garen',
        name: 'Garen',
        title: 'The Might of Demacia',
        blurb: 'A proud and noble warrior, Garen fights as one of the Dauntless Vanguard. He is popular among his comrades, and respected well enough by his enemies.',
        tags: ['Fighter', 'Tank'],
        partype: 'None',
        info: { attack: 7, defense: 7, magic: 1, difficulty: 5 },
        imageUrl: ddragonImg('Garen'),
        splashUrl: splash('Garen'),
        stats: {
            hp: 690,
            hpperlevel: 114,
            mp: 0,
            mpperlevel: 0,
            movespeed: 340,
            armor: 36,
            armorperlevel: 4.5,
            spellblock: 32,
            spellblockperlevel: 2.05,
            attackrange: 175,
            hpregen: 8,
            hpregenperlevel: 0.75,
            mpregen: 0,
            mpregenperlevel: 0,
            crit: 0,
            critperlevel: 0,
            attackdamage: 69,
            attackdamageperlevel: 4.5,
            attackspeed: 0.625,
            attackspeedperlevel: 2.9,
        },
        passive: {
            name: 'Perseverance',
            description:
                'If Garen has not recently been struck by damage or enemy abilities, he regenerates a percentage of his maximum health each second.',
        },
        spells: [
            {
                key: 'Q',
                name: 'Decisive Strike',
                description:
                    'Garen breaks free of slows and gains movement speed. His next basic attack deals bonus damage and silences the target.',
                cooldown: '8',
                cost: '0',
                range: 'Self',
                maxRank: 5,
            },
            {
                key: 'W',
                name: 'Courage',
                description:
                    'Passively grants armor and magic resist on champion takedowns. On activation, Garen gains a shield and reduced incoming damage.',
                cooldown: '23/21/19/17/15',
                cost: '0',
                range: 'Self',
                maxRank: 5,
            },
            {
                key: 'E',
                name: 'Judgment',
                description:
                    'Garen rapidly spins his sword around his body, dealing physical damage to nearby enemies.',
                cooldown: '9',
                cost: '0',
                range: '330',
                maxRank: 5,
            },
            {
                key: 'R',
                name: 'Demacian Justice',
                description:
                    'Garen calls upon the might of Demacia to attempt to execute an enemy champion.',
                cooldown: '120/100/80',
                cost: '0',
                range: '400',
                maxRank: 3,
            },
        ],
    },
    {
        id: 'Lux',
        name: 'Lux',
        title: 'the Lady of Luminosity',
        blurb: 'Luxanna Crownguard hails from Demacia, an insular realm where magical abilities are viewed with fear and suspicion.',
        tags: ['Mage', 'Support'],
        partype: 'Mana',
        info: { attack: 2, defense: 4, magic: 9, difficulty: 5 },
        imageUrl: ddragonImg('Lux'),
        splashUrl: splash('Lux'),
        stats: {
            hp: 560,
            hpperlevel: 99,
            mp: 480,
            mpperlevel: 23.5,
            movespeed: 330,
            armor: 19,
            armorperlevel: 4.7,
            spellblock: 30,
            spellblockperlevel: 1.3,
            attackrange: 550,
            hpregen: 2.5,
            hpregenperlevel: 0.55,
            mpregen: 7,
            mpregenperlevel: 0.8,
            crit: 0,
            critperlevel: 0,
            attackdamage: 54,
            attackdamageperlevel: 3.3,
            attackspeed: 0.669,
            attackspeedperlevel: 1.36,
        },
        passive: {
            name: 'Illumination',
            description:
                "Lux's damaging spells charge the target with energy. Lux's next attack ignites the energy, dealing bonus magic damage.",
        },
        spells: [
            {
                key: 'Q',
                name: 'Light Binding',
                description:
                    'Lux releases a sphere of light that binds and damages up to two enemies.',
                cooldown: '12/11/10/9/8',
                cost: '50/55/60/65/70',
                range: '1175',
                maxRank: 5,
            },
            {
                key: 'W',
                name: 'Prismatic Barrier',
                description:
                    'Lux throws her wand and bends the light around any friendly target it touches, shielding them from damage.',
                cooldown: '14/13/12/11/10',
                cost: '60',
                range: '1075',
                maxRank: 5,
            },
            {
                key: 'E',
                name: 'Lucent Singularity',
                description:
                    'Fires a sphere that slows and reveals enemies. Detonating it deals magic damage.',
                cooldown: '10/9/8/7/6',
                cost: '70/75/80/85/90',
                range: '1100',
                maxRank: 5,
            },
            {
                key: 'R',
                name: 'Final Spark',
                description:
                    'After a brief delay, Lux fires a giant beam of light, dealing massive damage to all enemies in the area.',
                cooldown: '80/65/50',
                cost: '100',
                range: '3340',
                maxRank: 3,
            },
        ],
    },
    {
        id: 'Jinx',
        name: 'Jinx',
        title: 'the Loose Cannon',
        blurb: 'A manic and impulsive criminal from Zaun, Jinx lives to wreak havoc without care for the consequences.',
        tags: ['Marksman'],
        partype: 'Mana',
        info: { attack: 9, defense: 2, magic: 4, difficulty: 6 },
        imageUrl: ddragonImg('Jinx'),
        splashUrl: splash('Jinx'),
        stats: {
            hp: 630,
            hpperlevel: 110,
            mp: 260,
            mpperlevel: 50,
            movespeed: 325,
            armor: 26,
            armorperlevel: 4.7,
            spellblock: 30,
            spellblockperlevel: 1.3,
            attackrange: 525,
            hpregen: 3.75,
            hpregenperlevel: 0.5,
            mpregen: 6.7,
            mpregenperlevel: 1,
            crit: 0,
            critperlevel: 0,
            attackdamage: 59,
            attackdamageperlevel: 3.4,
            attackspeed: 0.625,
            attackspeedperlevel: 1.0,
        },
        passive: {
            name: 'Get Excited!',
            description:
                'Jinx receives massively increased Movement Speed when she helps destroy a turret or kill an enemy champion or epic monster.',
        },
        spells: [
            {
                key: 'Q',
                name: 'Switcheroo!',
                description:
                    'Jinx swaps between Pow-Pow, her minigun, and Fishbones, her rocket launcher.',
                cooldown: '1',
                cost: '20',
                range: '525',
                maxRank: 5,
            },
            {
                key: 'W',
                name: 'Zap!',
                description:
                    'Jinx uses Zapper to fire a shock blast that damages and slows the first enemy hit.',
                cooldown: '9/8/7/6/5',
                cost: '50/60/70/80/90',
                range: '1500',
                maxRank: 5,
            },
            {
                key: 'E',
                name: 'Flame Chompers!',
                description:
                    'Jinx tosses out a line of snare grenades that explode after 5 seconds, dealing damage. Champions that walk over them are rooted.',
                cooldown: '24/21/18/15/12',
                cost: '70',
                range: '900',
                maxRank: 5,
            },
            {
                key: 'R',
                name: 'Super Mega Death Rocket!',
                description:
                    "Jinx fires a super rocket that gains damage as it travels and deals damage based on the victim's missing health.",
                cooldown: '85/65/45',
                cost: '100',
                range: 'Global',
                maxRank: 3,
            },
        ],
    },
];

export type Item = {
    id: string;
    name: string;
    cost: number;
    tags: string[];
    description: string;
    stats: Partial<{
        ad: number;
        ap: number;
        hp: number;
        mp: number;
        armor: number;
        mr: number;
        as: number;
        crit: number;
        ms: number;
        lethality: number;
        mpen: number;
        lifesteal: number;
        omnivamp: number;
        ahaste: number;
        hpregen: number;
    }>;
};

export const items: Item[] = [
    {
        id: 'infinity-edge',
        name: 'Infinity Edge',
        cost: 3300,
        tags: ['AD', 'Crit'],
        description: 'If you have at least 60% Crit Chance, gain 35% Crit Damage.',
        stats: { ad: 70, crit: 25 },
    },
    {
        id: 'bloodthirster',
        name: 'Bloodthirster',
        cost: 3400,
        tags: ['AD', 'Lifesteal'],
        description: 'Excess healing becomes a shield for up to 50-350 hp.',
        stats: { ad: 80, lifesteal: 18 },
    },
    {
        id: 'rabadons',
        name: "Rabadon's Deathcap",
        cost: 3600,
        tags: ['AP'],
        description: 'Increases your total Ability Power by 30%.',
        stats: { ap: 130 },
    },
    {
        id: 'void-staff',
        name: 'Void Staff',
        cost: 3000,
        tags: ['AP', 'Magic Pen'],
        description: "Magic damage ignores 40% of the target's magic resistance.",
        stats: { ap: 95, mpen: 40 },
    },
    {
        id: 'trinity-force',
        name: 'Trinity Force',
        cost: 3333,
        tags: ['AD', 'Bruiser'],
        description: 'After using an ability, your next attack deals bonus damage.',
        stats: { ad: 36, hp: 333, ahaste: 15, as: 33 },
    },
    {
        id: 'sunfire',
        name: 'Sunfire Aegis',
        cost: 3200,
        tags: ['Tank', 'Armor'],
        description: 'Immolate damages nearby enemies.',
        stats: { hp: 450, armor: 30, mr: 30 },
    },
    {
        id: 'rylais',
        name: "Rylai's Crystal Scepter",
        cost: 2600,
        tags: ['AP', 'Slow'],
        description: 'Damaging an enemy slows them by 30% for 1 second.',
        stats: { ap: 75, hp: 400 },
    },
    {
        id: 'berserkers',
        name: "Berserker's Greaves",
        cost: 1100,
        tags: ['Boots', 'Attack Speed'],
        description: 'Enhanced Movement.',
        stats: { ms: 45, as: 35 },
    },
    {
        id: 'sorcs',
        name: "Sorcerer's Shoes",
        cost: 1100,
        tags: ['Boots', 'Magic Pen'],
        description: 'Enhanced Movement.',
        stats: { ms: 45, mpen: 18 },
    },
    {
        id: 'deaths-dance',
        name: "Death's Dance",
        cost: 3300,
        tags: ['AD', 'Bruiser'],
        description: 'Damage taken is dealt over 3 seconds instead of immediately.',
        stats: { ad: 55, armor: 45, ahaste: 15 },
    },
    {
        id: 'warmogs',
        name: "Warmog's Armor",
        cost: 3100,
        tags: ['Tank', 'Health'],
        description: 'Out of combat, regenerate 5% max HP per second.',
        stats: { hp: 800, hpregen: 200, ahaste: 10 },
    },
    {
        id: 'luden',
        name: "Luden's Companion",
        cost: 3200,
        tags: ['AP', 'Mana'],
        description: 'Periodically empowers your next ability with bonus damage.',
        stats: { ap: 95, mp: 600, ahaste: 20 },
    },
];

export type SummonerSpell = {
    id: string;
    name: string;
    description: string;
    cooldown: number;
    range: string;
};

export const summonerSpells: SummonerSpell[] = [
    {
        id: 'flash',
        name: 'Flash',
        description: "Teleports your champion a short distance toward your cursor's location.",
        cooldown: 300,
        range: '400',
    },
    {
        id: 'ignite',
        name: 'Ignite',
        description: 'Ignites target enemy champion, dealing 70-410 true damage over 5 seconds.',
        cooldown: 180,
        range: '600',
    },
    {
        id: 'heal',
        name: 'Heal',
        description:
            'Restores HP to your champion and the most wounded nearby ally and grants both 30% movement speed.',
        cooldown: 240,
        range: '850',
    },
    {
        id: 'teleport',
        name: 'Teleport',
        description: 'After channeling for 4 seconds, teleports to target allied structure.',
        cooldown: 360,
        range: 'Global',
    },
    {
        id: 'smite',
        name: 'Smite',
        description:
            'Deals true damage to monsters and minions. Upgrades into Challenging or Chilling Smite.',
        cooldown: 90,
        range: '500',
    },
    {
        id: 'exhaust',
        name: 'Exhaust',
        description: 'Slows target champion and reduces their damage dealt by 35% for 2.5 seconds.',
        cooldown: 210,
        range: '650',
    },
    {
        id: 'barrier',
        name: 'Barrier',
        description: 'Shields your champion for 115-455 for 2 seconds.',
        cooldown: 180,
        range: 'Self',
    },
    {
        id: 'cleanse',
        name: 'Cleanse',
        description: 'Removes all disables and reduces duration of incoming impairing effects.',
        cooldown: 240,
        range: 'Self',
    },
    {
        id: 'ghost',
        name: 'Ghost',
        description:
            'Your champion gains 24-48% movement speed and can move through units for 10 seconds.',
        cooldown: 210,
        range: 'Self',
    },
];

export function calculateStats(champion: Champion, level: number, selectedItems: Item[]) {
    const s = champion.stats;
    const lv = level - 1;
    // Riot per-level scaling: stat = base + perLevel * (lv) * (0.7025 + 0.0175 * lv) for some, simplified linear here
    const base = {
        hp: s.hp + s.hpperlevel * lv,
        mp: s.mp + s.mpperlevel * lv,
        armor: s.armor + s.armorperlevel * lv,
        mr: s.spellblock + s.spellblockperlevel * lv,
        ad: s.attackdamage + s.attackdamageperlevel * lv,
        as: s.attackspeed * (1 + (s.attackspeedperlevel / 100) * lv),
        ms: s.movespeed,
        hpregen: s.hpregen + s.hpregenperlevel * lv,
        mpregen: s.mpregen + s.mpregenperlevel * lv,
        crit: 0,
        ap: 0,
        lethality: 0,
        mpen: 0,
        lifesteal: 0,
        ahaste: 0,
    };
    for (const item of selectedItems) {
        const it = item.stats;
        if (it.hp) base.hp += it.hp;
        if (it.mp) base.mp += it.mp;
        if (it.armor) base.armor += it.armor;
        if (it.mr) base.mr += it.mr;
        if (it.ad) base.ad += it.ad;
        if (it.ap) base.ap += it.ap;
        if (it.crit) base.crit += it.crit;
        if (it.as) base.as *= 1 + it.as / 100;
        if (it.ms) base.ms += it.ms;
        if (it.lethality) base.lethality += it.lethality;
        if (it.mpen) base.mpen += it.mpen;
        if (it.lifesteal) base.lifesteal += it.lifesteal;
        if (it.ahaste) base.ahaste += it.ahaste;
        if (it.hpregen) base.hpregen += it.hpregen;
    }
    return base;
}
