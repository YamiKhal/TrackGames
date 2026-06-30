import fileStructure from "./rules/file-structure.js";
import sectionSpacing from "./rules/section-spacing.js";
import readonlyComponentProps from "./rules/readonly-component-props.js";
import booleanPropNaming from "./rules/boolean-prop-naming.js";

const rules = {
	rules: {
		"file-structure": fileStructure,
		"section-spacing": sectionSpacing,
		"readonly-component-props": readonlyComponentProps,
		"boolean-prop-naming": booleanPropNaming,
	},
};

export default rules;
