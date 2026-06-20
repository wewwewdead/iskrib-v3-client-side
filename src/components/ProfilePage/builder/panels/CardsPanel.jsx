import { CARD_STYLES, CARD_RADII, CARD_BORDERS, CARD_SHADOWS } from "../profileThemeConstants";
import { FieldLabel, OptionButtons } from "./BuilderControls";

const toOptions = (list) => list.map((item) => ({ key: item.key, label: item.label }));

const CardsPanel = ({ theme, onPatchCards }) => (
    <div className="pt-panel">
        <div className="pt-field">
            <FieldLabel>Style</FieldLabel>
            <OptionButtons
                ariaLabel="Card style"
                options={toOptions(CARD_STYLES)}
                value={theme.cards.style}
                onChange={(style) => onPatchCards({ style })}
            />
        </div>

        <div className="pt-field">
            <FieldLabel>Corners</FieldLabel>
            <OptionButtons
                ariaLabel="Card corners"
                options={toOptions(CARD_RADII)}
                value={theme.cards.radius}
                onChange={(radius) => onPatchCards({ radius })}
            />
        </div>

        <div className="pt-field">
            <FieldLabel>Border</FieldLabel>
            <OptionButtons
                ariaLabel="Card border"
                options={toOptions(CARD_BORDERS)}
                value={theme.cards.border}
                onChange={(border) => onPatchCards({ border })}
            />
        </div>

        <div className="pt-field">
            <FieldLabel>Shadow</FieldLabel>
            <OptionButtons
                ariaLabel="Card shadow"
                options={toOptions(CARD_SHADOWS)}
                value={theme.cards.shadow}
                onChange={(shadow) => onPatchCards({ shadow })}
            />
        </div>
    </div>
);

export default CardsPanel;
