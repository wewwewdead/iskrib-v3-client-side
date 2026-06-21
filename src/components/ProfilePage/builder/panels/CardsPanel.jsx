import { CARD_STYLES, CARD_RADII, CARD_BORDERS, CARD_SHADOWS, LAYOUT_BLOCK_LABELS } from "../profileThemeConstants";
import { FieldLabel, OptionButtons } from "./BuilderControls";

const toOptions = (list) => list.map((item) => ({ key: item.key, label: item.label }));

/**
 * Cards panel. By default it edits the page-wide card style (`theme.cards`).
 * When a container is selected in the live preview, it instead edits THAT
 * container's own card override (`block.card`) via onPatchBlockCard — so styling
 * one container never touches the others. "Edit whole page" clears the selection.
 */
const CardsPanel = ({
    theme,
    onPatchCards,
    selectedBlock,
    onPatchBlockCard,
    onResetBlockCard,
    onClearSelection,
}) => {
    const editingBlock = Boolean(selectedBlock);
    const label = selectedBlock
        ? LAYOUT_BLOCK_LABELS[selectedBlock.type] || selectedBlock.type
        : null;

    // Effective values shown by the controls: the block's override if it has one,
    // else the page-wide card style (so editing a container starts from the page).
    const values = editingBlock ? selectedBlock.card || theme.cards : theme.cards;
    const setField = (partial) =>
        editingBlock ? onPatchBlockCard(selectedBlock.type, partial) : onPatchCards(partial);

    return (
        <div className="pt-panel">
            <div className="pt-cards-scope">
                {editingBlock ? (
                    <>
                        <span className="pt-cards-scope-label">
                            Editing <strong>{label}</strong>
                        </span>
                        <button
                            type="button"
                            className="pt-cards-scope-btn"
                            onClick={onClearSelection}
                        >
                            Edit whole page
                        </button>
                    </>
                ) : (
                    <span className="pt-cards-scope-label pt-cards-scope-label--page">
                        Editing the whole page
                    </span>
                )}
            </div>

            {editingBlock && !selectedBlock.card && (
                <p className="pt-panel-hint">
                    Pick any option below to style just this container. Other containers stay on
                    the page style.
                </p>
            )}

            <div className="pt-field">
                <FieldLabel>Style</FieldLabel>
                <OptionButtons
                    ariaLabel="Card style"
                    options={toOptions(CARD_STYLES)}
                    value={values.style}
                    onChange={(style) => setField({ style })}
                />
            </div>

            <div className="pt-field">
                <FieldLabel>Corners</FieldLabel>
                <OptionButtons
                    ariaLabel="Card corners"
                    options={toOptions(CARD_RADII)}
                    value={values.radius}
                    onChange={(radius) => setField({ radius })}
                />
            </div>

            <div className="pt-field">
                <FieldLabel>Border</FieldLabel>
                <OptionButtons
                    ariaLabel="Card border"
                    options={toOptions(CARD_BORDERS)}
                    value={values.border}
                    onChange={(border) => setField({ border })}
                />
            </div>

            <div className="pt-field">
                <FieldLabel>Shadow</FieldLabel>
                <OptionButtons
                    ariaLabel="Card shadow"
                    options={toOptions(CARD_SHADOWS)}
                    value={values.shadow}
                    onChange={(shadow) => setField({ shadow })}
                />
            </div>

            {editingBlock && selectedBlock.card && (
                <button
                    type="button"
                    className="pt-cards-reset"
                    onClick={() => onResetBlockCard(selectedBlock.type)}
                >
                    Reset to page style
                </button>
            )}
        </div>
    );
};

export default CardsPanel;
