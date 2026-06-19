import { ITEM_TAG_TEXT_CLASS, type ItemDescriptionPart } from '@/pages/items/utils';
import { Fragment } from 'react';

export function ItemDescriptionParts({ parts }: { parts: ItemDescriptionPart[] }) {
	return (
		<>
			{parts.map((part, i) => {
				if (part.kind === 'colored') {
					return (
						<span key={i} className={`${ITEM_TAG_TEXT_CLASS[part.tag]} font-semibold`}>
							{' '}
							{part.value}{' '}
						</span>
					);
				}

				return (
					<Fragment key={i}>
						{part.value.split('\n').map((line, j, lines) => (
							<Fragment key={j}>
								{j > 0 ? <br /> : null}
								{line}
							</Fragment>
						))}
					</Fragment>
				);
			})}
		</>
	);
}
