/** Small reusable controls shared across builder panels. */

export const FieldLabel = ({ children, htmlFor }) => (
    <label className="pt-field-label" htmlFor={htmlFor}>
        {children}
    </label>
);

/**
 * A row of mutually-exclusive option buttons.
 * options: [{ key, label }]
 */
export const OptionButtons = ({ options, value, onChange, ariaLabel }) => (
    <div className="pt-option-row" role="group" aria-label={ariaLabel}>
        {options.map((option) => (
            <button
                key={option.key}
                type="button"
                className={`pt-option-btn${value === option.key ? " is-active" : ""}`}
                aria-pressed={value === option.key}
                onClick={() => onChange(option.key)}
                style={option.style}
            >
                {option.label}
            </button>
        ))}
    </div>
);
