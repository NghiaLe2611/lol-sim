import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/AppContext';
import { STALE_MS } from '@/constants/common';
import { getBonusChampions, getChampions } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ROLE_BAR_ITEMS,
	selectBonusPositionsOnly,
	type ChampionRoleFilter,
} from '../champions/role-filter';
import ChampionList from './ChampionList';
import { championsFromQueryData, filterChampionListRows } from './champion-list-filter';
import { Button } from '@/components/ui/button';
import { ArrowLeftRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface SimulateDialogProps {
	data: Record<string, unknown>;
	attackerId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type SimulateChampionPanelProps = {
	titleBorderCls: string;
	champions: ReturnType<typeof filterChampionListRows>;
	loading: boolean;
	selectedId: string | null;
	onSelect: (id: string) => void;
	getImageUrl: (championId: string) => string;
	search: string;
	onSearchChange: (value: string) => void;
	activeRole: ChampionRoleFilter;
	onRoleChange: (role: ChampionRoleFilter) => void;
};

function SimulateChampionPanel({
	titleBorderCls,
	champions,
	loading,
	selectedId,
	onSelect,
	getImageUrl,
	search,
	onSearchChange,
	activeRole,
	onRoleChange,
}: SimulateChampionPanelProps) {
	const selectedChampion = champions.find((champ) => champ.id === selectedId);

	return (
		<div className="space-y-3 animate-fade-up min-w-0 duration-75">
			<div className="relative overflow-hidden h-24 bg-zinc-900 rounded-sm">
				<div className="z-[1] absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-black/10"></div>
				{selectedId ? (
					<img
						alt={`${selectedId}-splash`}
						className="absolute inset-0 w-full h-full object-cover"
						src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedId}_0.jpg`}
						style={{ objectPosition: '55% 20%' }}
					/>
				) : null}
				<div className="z-[2] absolute h-full w-full p-2 flex items-center gap-2">
					{selectedId ? (
						<img
							alt={`${selectedId}-square`}
							src={getImageUrl(selectedId)}
							className={clsx('size-9 rounded-sm border shadow-sm', titleBorderCls)}
						/>
					) : (
						<div
							className={clsx('size-9 rounded-sm border bg-zinc-800', titleBorderCls)}
						/>
					)}
					<span className="text-xs 2xl:text-sm font-medium">
						{selectedChampion?.name ?? 'Select champion'}
					</span>
				</div>
			</div>

			<div className="space-y-1.5 mb-2">
				<Input
					placeholder="Search champion..."
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="bg-card-foreground w-full !text-xs placeholder:dark:text-gray-400 rounded-sm border-input focus-visible:border-hex-gold/50 focus-visible:ring-2 ring-hex-gold/20"
				/>
				<div className="flex gap-2">
					{ROLE_BAR_ITEMS.map((item) => {
						const isActive = activeRole === item.id;
						return (
							<button
								key={item.id}
								type="button"
								title={item.tooltip}
								onClick={() => onRoleChange(item.id)}
								className={clsx(
									item.id === 'All'
										? 'min-h-full w-9 border border-input rounded-sm p-1 text-xs bg-gray-200/70 hover:bg-gray-300 dark:bg-stone-900 hover:dark:bg-zinc-700'
										: 'h-full w-9 border border-input rounded-sm p-1 bg-gray-200/70 hover:bg-gray-300 dark:bg-stone-900 hover:dark:bg-zinc-700 group',
									isActive &&
										'border-hex-gold/50 bg-zinc-300 dark:bg-stone-700 text-hex-gold'
								)}
							>
								{item.id === 'All' ? (
									<span
										className={clsx(
											'text-gray-500 dark:text-gray-400',
											isActive && 'text-hex-gold'
										)}
									>
										All
									</span>
								) : (
									<img
										alt={item.tooltip}
										src={item.iconSrc}
										className={clsx(
											'mx-auto brightness-75 dark:brightness-50 group-hover:dark:brightness-100 group-hover:brightness-50',
											isActive && 'brightness-50 dark:brightness-100'
										)}
										height={20}
										width={20}
									/>
								)}
							</button>
						);
					})}
				</div>
			</div>

			<ChampionList
				champions={champions}
				loading={loading}
				selectedId={selectedId}
				onSelect={onSelect}
				getImageUrl={getImageUrl}
				wrapperCls="h-[320px] border border-hex-gold/20 rounded !bg-card-foreground"
				containerCls="lg:!grid-cols-6 2xl:!grid-cols-8 border-none items-start"
				skeletonCount={8}
			/>

			<div className="flex items-center gap-2 bg-card-foreground p-4 rounded-sm border border-input">
				<span className="text-xs uppercase text-hex-gold font-bold tracking-wider">
					Level
				</span>
				<Slider
					// value={[level]}
					// onValueChange={(val) => setLevel(val[0])}
					min={1}
					max={18}
					step={1}
					className="build-level-slider py-2"
				/>
				<span className="ml-8 text-sm 2xl:text-base font-semibold">1</span>
			</div>
		</div>
	);
}

const SimulateDialog = ({ data: _data, attackerId, open, onOpenChange }: SimulateDialogProps) => {
	const { patchVersion, isPatchReady } = useAppContext();

	const [attackerSearch, setAttackerSearch] = useState('');
	const [attackerRole, setAttackerRole] = useState<ChampionRoleFilter>('All');
	const [targetSearch, setTargetSearch] = useState('');
	const [targetRole, setTargetRole] = useState<ChampionRoleFilter>('All');
	const [attackerChampionId, setAttackerChampionId] = useState<string | null>(attackerId);
	const [targetChampionId, setTargetChampionId] = useState<string | null>(null);

	const championsQuery = useQuery({
		queryKey: ['champions', patchVersion],
		queryFn: () => getChampions(patchVersion!),
		enabled: isPatchReady,
	});

	const bonusQuery = useQuery({
		queryKey: ['champions_bonus'],
		queryFn: () => getBonusChampions(),
		staleTime: STALE_MS,
		gcTime: STALE_MS,
	});

	const bonusPositionsMap = useMemo(
		() => selectBonusPositionsOnly(bonusQuery.data),
		[bonusQuery.data]
	);

	const allChampions = useMemo(
		() => championsFromQueryData(championsQuery.data),
		[championsQuery.data]
	);

	const championsLoading =
		!championsQuery.isError &&
		(!isPatchReady ||
			championsQuery.isPending ||
			(championsQuery.isFetching && championsQuery.data === undefined));

	const filterOptions = useMemo(
		() => ({
			bonusPositionsMap,
			hasBonusData: Boolean(bonusQuery.data),
		}),
		[bonusPositionsMap, bonusQuery.data]
	);

	const filteredAttackers = useMemo(
		() =>
			filterChampionListRows(allChampions, {
				search: attackerSearch,
				role: attackerRole,
				...filterOptions,
			}),
		[allChampions, attackerSearch, attackerRole, filterOptions]
	);

	const filteredTargets = useMemo(
		() =>
			filterChampionListRows(allChampions, {
				search: targetSearch,
				role: targetRole,
				...filterOptions,
			}),
		[allChampions, targetSearch, targetRole, filterOptions]
	);

	const getChampImgUrl = useCallback(
		(champId: string) =>
			`https://ddragon.leagueoflegends.com/cdn/${patchVersion || '14.23.1'}/img/champion/${champId}.png`,
		[patchVersion]
	);

	useEffect(() => {
		if (!open) return;
		setAttackerChampionId(attackerId);
		setAttackerSearch('');
		setAttackerRole('All');
		setTargetSearch('');
		setTargetRole('All');
	}, [open, attackerId]);

	useEffect(() => {
		if (!open || filteredAttackers.length === 0) return;
		if (!attackerChampionId || !filteredAttackers.some((c) => c.id === attackerChampionId)) {
			setAttackerChampionId(filteredAttackers[0].id);
		}
	}, [open, filteredAttackers, attackerChampionId]);

	useEffect(() => {
		if (!open || filteredTargets.length === 0) return;
		if (!targetChampionId || !filteredTargets.some((c) => c.id === targetChampionId)) {
			setTargetChampionId(filteredTargets[0].id);
		}
	}, [open, filteredTargets, targetChampionId]);

	// Swap position
	const handleSwapChampions = () => {
		const temp = attackerChampionId;
		setAttackerChampionId(targetChampionId);
		setTargetChampionId(temp);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="outline:none w-full h-full !max-w-container max-h-[95vh] gap-3 !ring-0 dark:bg-[#0c0c0c] !border-none shadow-[0_0_10px] shadow-hex-gold/50 overflow-hidden"
				onOpenAutoFocus={(e) => e.preventDefault()}
			>
				<VisuallyHidden.Root>
					<DialogTitle>Simulate Damage</DialogTitle>
					<DialogDescription>Simulate Damage</DialogDescription>
				</VisuallyHidden.Root>
				<div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 pt-8">
					<SimulateChampionPanel
						titleBorderCls="border-blue-500 shadow-blue-500"
						champions={filteredAttackers}
						loading={championsLoading}
						selectedId={attackerChampionId}
						onSelect={setAttackerChampionId}
						getImageUrl={getChampImgUrl}
						search={attackerSearch}
						onSearchChange={setAttackerSearch}
						activeRole={attackerRole}
						onRoleChange={setAttackerRole}
					/>

					<div className="flex-col items-center gap-3 lg:min-w-[340px] lg:max-w-[400px] w-full animate-fade-up hidden lg:flex duration-100">
						<div className="h-24 w-full flex flex-col">
							<div className="flex flex-1 items-center gap-3">
								<div className="flex-1 h-px bg-hex-gold/20"></div>
								<div className="text-lg font-bold text-muted-foreground">VS</div>
								<div className="flex-1 h-px bg-hex-gold/20"></div>
							</div>
							<div className="text-center">
								<Button
									onClick={handleSwapChampions}
									variant="outline"
									className="border-input hover:border-hex-gold/50 text-xs 4xl:text-sm text-muted-foreground bg-transparent hover:bg-transparent"
								>
									<ArrowLeftRight className="!size-3.5" />
									Swap
								</Button>
							</div>
						</div>
					</div>

					<div className="hidden lg:block">
						<SimulateChampionPanel
							titleBorderCls="border-red-500 shadow-red-500"
							champions={filteredTargets}
							loading={championsLoading}
							selectedId={targetChampionId}
							onSelect={setTargetChampionId}
							getImageUrl={getChampImgUrl}
							search={targetSearch}
							onSearchChange={setTargetSearch}
							activeRole={targetRole}
							onRoleChange={setTargetRole}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SimulateDialog;
